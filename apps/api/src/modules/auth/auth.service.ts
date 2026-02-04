// Authentication Service
// Handles user authentication, registration, and token management

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType } from '../../common/audit/audit.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto, UserResponseDto } from './dto/token-response.dto';
import { JwtPayload, SafeUser } from '@sports-booking/shared';
import { User, UserRole } from '@sports-booking/database';

// Constants
const BCRYPT_SALT_ROUNDS = 12;
const SECONDS_IN_DAY = 86400;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  /**
   * Validates user credentials
   * @returns User without password if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password hash
    return this.sanitizeUser(user);
  }

  /**
   * Authenticates user and generates JWT token
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase();

    // Validate credentials
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Log failed login attempt - user not found
      this.auditService.logAuth(AuditEventType.AUTH_FAILED_ATTEMPT, {
        action: `Login failed: user not found for email ${normalizedEmail}`,
        metadata: { email: normalizedEmail, reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      // Log failed login attempt - account deactivated
      this.auditService.logAuth(AuditEventType.AUTH_FAILED_ATTEMPT, {
        tenantId: user.tenantId,
        actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
        action: `Login failed: account deactivated for ${user.email}`,
        metadata: { reason: 'ACCOUNT_DEACTIVATED' },
      });
      throw new UnauthorizedException('Account is deactivated. Please contact support.');
    }

    const isPasswordValid = await this.comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      // Log failed login attempt - invalid password
      this.auditService.logAuth(AuditEventType.AUTH_FAILED_ATTEMPT, {
        tenantId: user.tenantId,
        actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
        action: `Login failed: invalid password for ${user.email}`,
        metadata: { reason: 'INVALID_PASSWORD' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = await this.generateToken(user);

    // Log successful login
    this.auditService.logAuth(AuditEventType.AUTH_LOGIN, {
      tenantId: user.tenantId,
      actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
      action: `User ${user.email} logged in successfully`,
      entity: { type: 'USER', id: user.id },
    });

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      user: this.toUserResponseDto(user),
    };
  }

  /**
   * Registers a new user
   * Note: This creates an OWNER user by default.
   * SUPER_ADMIN and STAFF are created through different processes.
   */
  async register(
    registerDto: RegisterDto,
    options?: { role?: UserRole; tenantId?: string },
  ): Promise<UserResponseDto> {
    const { email, password, fullName, phone } = registerDto;
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Determine role (default to OWNER for self-registration)
    const role = options?.role || 'OWNER';
    const tenantId = options?.tenantId || null;

    // Validate tenantId requirement based on role
    if (role !== 'SUPER_ADMIN' && !tenantId) {
      throw new BadRequestException('Non-admin users must be associated with a tenant');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        phone: phone || null,
        role,
        tenantId,
        isActive: true,
      },
    });

    // Log successful registration
    this.auditService.logAuth(AuditEventType.AUTH_REGISTER, {
      tenantId: user.tenantId,
      actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
      action: `New user registered: ${user.email} with role ${role}`,
      entity: { type: 'USER', id: user.id },
      metadata: { role, tenantId },
    });

    this.logger.log(`New user registered: ${user.email} with role ${role}`);

    return this.toUserResponseDto(user);
  }

  /**
   * Creates a Super Admin user (internal use only)
   */
  async createSuperAdmin(
    email: string,
    password: string,
    fullName: string,
  ): Promise<UserResponseDto> {
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        phone: null,
        role: 'SUPER_ADMIN',
        tenantId: null,
        isActive: true,
      },
    });

    // Log Super Admin creation
    this.auditService.logAuth(AuditEventType.AUTH_REGISTER, {
      actor: { type: 'SYSTEM', id: null },
      action: `Super Admin created: ${user.email}`,
      entity: { type: 'USER', id: user.id },
      metadata: { role: 'SUPER_ADMIN' },
    });

    this.logger.log(`Super Admin created: ${user.email}`);

    return this.toUserResponseDto(user);
  }

  /**
   * Gets the current user's profile
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toUserResponseDto(user);
  }

  /**
   * Refreshes the access token
   */
  async refreshToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = await this.generateToken(user);

    // Log token refresh
    this.auditService.logAuth(AuditEventType.AUTH_TOKEN_REFRESH, {
      tenantId: user.tenantId,
      actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
      action: `Token refreshed for user ${user.email}`,
      entity: { type: 'USER', id: user.id },
    });

    return token;
  }

  /**
   * Changes user's password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isValid = await this.comparePasswords(currentPassword, user.passwordHash);
    if (!isValid) {
      // Log failed password change attempt
      this.auditService.logAuth(AuditEventType.AUTH_FAILED_ATTEMPT, {
        tenantId: user.tenantId,
        actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
        action: `Password change failed for ${user.email}: incorrect current password`,
        entity: { type: 'USER', id: user.id },
        metadata: { reason: 'INCORRECT_CURRENT_PASSWORD' },
      });
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log successful password change
    this.auditService.logAuth(AuditEventType.AUTH_PASSWORD_CHANGE, {
      tenantId: user.tenantId,
      actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
      action: `Password changed successfully for ${user.email}`,
      entity: { type: 'USER', id: user.id },
    });

    this.logger.log(`Password changed for user ${user.email}`);
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Hashes a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compares plain password with hashed password
   */
  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generates JWT token for user
   */
  private async generateToken(
    user: User,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    });

    return {
      accessToken,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Parses JWT expiration string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * SECONDS_IN_DAY; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * SECONDS_IN_DAY;
      default:
        return 7 * SECONDS_IN_DAY;
    }
  }

  /**
   * Removes password hash from user object
   */
  private sanitizeUser(user: User): SafeUser {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Converts User to UserResponseDto
   */
  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
