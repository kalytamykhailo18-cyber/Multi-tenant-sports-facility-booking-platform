// Authentication Controller
// Handles HTTP requests for authentication operations

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  TokenResponseDto,
  UserResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, Public } from '../../common/decorators';
import { AuditService, AuditEventType } from '../../common/audit';
import { RequestUser } from './strategies/jwt.strategy';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * User login endpoint
   * Validates credentials and returns JWT token
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user with email and password, returns JWT token',
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account deactivated',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * User registration endpoint
   * Note: In production, this would typically be restricted or require admin approval
   * For now, it creates an OWNER user that needs a tenant association
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Creates a new user account. Note: In production, this may require admin approval or be restricted.',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email already exists or validation failed',
  })
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    // Note: In a real implementation, this endpoint would either:
    // 1. Be restricted to admins
    // 2. Create the user in a pending state
    // 3. Require a valid tenant invitation
    // For MVP, we'll throw an error indicating tenant is required
    return this.authService.register(registerDto);
  }

  /**
   * Get current user profile
   * Requires valid JWT token
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated or token expired',
  })
  async getProfile(@CurrentUser() user: RequestUser): Promise<UserResponseDto> {
    return this.authService.getProfile(user.id);
  }

  /**
   * Refresh access token
   * Requires valid JWT token
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new JWT token from a valid existing token',
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: RefreshTokenDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid or expired',
  })
  async refreshToken(
    @CurrentUser() user: RequestUser,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return this.authService.refreshToken(user.id);
  }

  /**
   * User logout endpoint
   * In stateless JWT, this is mainly for client-side cleanup
   * Could be extended to add token to blacklist if needed
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'User logout',
    description:
      'Logs out the current user. Client should discard the token after this call.',
  })
  @ApiOkResponse({
    description: 'Logout successful',
  })
  async logout(@CurrentUser() user: RequestUser): Promise<{ message: string }> {
    // Log logout event
    this.auditService.logAuth(AuditEventType.AUTH_LOGOUT, {
      tenantId: user.tenantId,
      actor: { type: 'USER', id: user.id, email: user.email, role: user.role },
      action: `User ${user.email} logged out`,
      entity: { type: 'USER', id: user.id },
    });

    // In stateless JWT, logout is handled client-side by discarding the token
    // If we need server-side token invalidation, we would add the token to a blacklist
    return { message: 'Logged out successfully' };
  }

  /**
   * Change password endpoint
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the current user password',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Current password incorrect or validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
  })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }
}
