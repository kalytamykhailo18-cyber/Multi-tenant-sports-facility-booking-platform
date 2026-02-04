// Facilities Service
// Full facility management operations

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantAwarePrismaService } from '../../common/tenant/tenant-aware-prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../common/audit/audit.types';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { WsGateway } from '../../common/gateway/ws.gateway';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { QueryFacilityDto } from './dto/query-facility.dto';
import { FacilityResponseDto, FacilityListResponseDto, CredentialsStatusDto } from './dto/facility-response.dto';
import { QrCodeResponseDto, GenerateQrCodeDto } from './dto/qr-code.dto';
import { RegisterFacilityDto, RegisterFacilityResponseDto } from './dto/register-facility.dto';
import { Facility, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FacilitiesService {
  private readonly logger = new Logger(FacilitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantAwarePrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService,
    private readonly wsGateway: WsGateway,
  ) {}

  /**
   * Create a new facility
   */
  async create(dto: CreateFacilityDto): Promise<FacilityResponseDto> {
    const {
      tenantId,
      name,
      address,
      city,
      country,
      phone,
      email,
      timezone = 'America/Argentina/Buenos_Aires',
      currencyCode = 'ARS',
      depositPercentage = 50,
      cancellationHours = 24,
      minBookingNoticeHours = 2,
      maxBookingAdvanceDays = 30,
      bufferMinutes = 0,
      sessionDurationMinutes = [60, 90],
      whatsappPhone,
      status = 'ACTIVE',
    } = dto;

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Create facility
    const facility = await this.prisma.facility.create({
      data: {
        tenantId,
        name,
        address,
        city,
        country,
        phone,
        email,
        timezone,
        currencyCode,
        depositPercentage,
        cancellationHours,
        minBookingNoticeHours,
        maxBookingAdvanceDays,
        bufferMinutes,
        sessionDurationMinutes,
        whatsappPhone,
        status,
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.FACILITY_CREATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Facility created: ${facility.name}`,
      entity: { type: 'FACILITY', id: facility.id },
      metadata: { name, city, tenantId },
    });

    this.logger.log(`Facility created: ${facility.name} (${facility.id})`);

    // Emit socket event for real-time updates
    this.wsGateway.emitToTenant(facility.tenantId, 'facility:created', {
      id: facility.id,
      name: facility.name,
    });

    return this.toResponseDto(facility);
  }

  /**
   * Find all facilities with pagination and filtering
   */
  async findAll(query: QueryFacilityDto): Promise<FacilityListResponseDto> {
    const {
      page = 1,
      limit = 10,
      status,
      tenantId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.FacilityWhereInput = {};

    // Filter by tenant if specified, or use context tenant for non-super-admin
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (tenantId) {
      // Super Admin can query any tenant
      if (!isSuperAdmin && contextTenantId !== tenantId) {
        throw new ForbiddenException('Cannot access facilities for another tenant');
      }
      where.tenantId = tenantId;
    } else if (!isSuperAdmin && contextTenantId) {
      // Non-super-admin users can only see their tenant's facilities
      where.tenantId = contextTenantId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [facilities, total] = await Promise.all([
      this.prisma.facility.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              courts: true,
            },
          },
        },
      }),
      this.prisma.facility.count({ where }),
    ]);

    // Map to response DTOs
    const items: FacilityResponseDto[] = facilities.map((facility) =>
      this.toResponseDto(facility, facility._count.courts),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find facility by ID
   */
  async findById(id: string): Promise<FacilityResponseDto> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courts: true,
          },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot access this facility');
    }

    return this.toResponseDto(facility, facility._count.courts);
  }

  /**
   * Update a facility
   */
  async update(id: string, dto: UpdateFacilityDto): Promise<FacilityResponseDto> {
    // Verify facility exists and check access
    const existingFacility = await this.prisma.facility.findUnique({
      where: { id },
    });

    if (!existingFacility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== existingFacility.tenantId) {
      throw new ForbiddenException('Cannot update this facility');
    }

    // Update facility
    const facility = await this.prisma.facility.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currencyCode !== undefined && { currencyCode: dto.currencyCode }),
        ...(dto.depositPercentage !== undefined && { depositPercentage: dto.depositPercentage }),
        ...(dto.cancellationHours !== undefined && { cancellationHours: dto.cancellationHours }),
        ...(dto.minBookingNoticeHours !== undefined && { minBookingNoticeHours: dto.minBookingNoticeHours }),
        ...(dto.maxBookingAdvanceDays !== undefined && { maxBookingAdvanceDays: dto.maxBookingAdvanceDays }),
        ...(dto.bufferMinutes !== undefined && { bufferMinutes: dto.bufferMinutes }),
        ...(dto.sessionDurationMinutes !== undefined && { sessionDurationMinutes: dto.sessionDurationMinutes }),
        ...(dto.whatsappPhone !== undefined && { whatsappPhone: dto.whatsappPhone }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        _count: {
          select: {
            courts: true,
          },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.FACILITY_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Facility updated: ${facility.name}`,
      entity: { type: 'FACILITY', id: facility.id },
      metadata: { changes: dto },
      changes: {
        before: existingFacility as unknown as Record<string, unknown>,
        after: facility as unknown as Record<string, unknown>,
      },
    });

    this.logger.log(`Facility updated: ${facility.name} (${facility.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(facility.tenantId, 'facility:updated', {
      id: facility.id,
      name: facility.name,
    });

    return this.toResponseDto(facility, facility._count.courts);
  }

  /**
   * Delete a facility
   */
  async delete(id: string): Promise<{ message: string }> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courts: true,
          },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot delete this facility');
    }

    // Check for associated data
    if (facility._count.courts > 0) {
      // Soft delete - set status to INACTIVE
      await this.prisma.facility.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });

      this.auditService.log({
        category: AuditEventCategory.FACILITY,
        eventType: AuditEventType.FACILITY_STATUS_CHANGED,
        tenantId: facility.tenantId,
        actor: { type: 'SYSTEM', id: null },
        action: `Facility deactivated (has courts): ${facility.name}`,
        entity: { type: 'FACILITY', id: facility.id },
        metadata: { deleteType: 'soft', courtsCount: facility._count.courts },
      });

      this.logger.log(`Facility deactivated: ${facility.name} (${facility.id})`);

      return { message: `Facility "${facility.name}" has been deactivated (has associated courts)` };
    }

    // Hard delete
    await this.prisma.facility.delete({
      where: { id },
    });

    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.FACILITY_STATUS_CHANGED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Facility permanently deleted: ${facility.name}`,
      entity: { type: 'FACILITY', id: facility.id },
      metadata: { deleteType: 'hard' },
    });

    this.logger.log(`Facility permanently deleted: ${facility.name} (${facility.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(facility.tenantId, 'facility:deleted', { id: facility.id });

    return { message: `Facility "${facility.name}" has been permanently deleted` };
  }

  /**
   * Update AI customization (greeting, business info, FAQs)
   * NOTE: AI API keys are centralized in backend .env - NOT per-facility
   */
  async updateAICustomization(
    id: string,
    data: { aiGreeting?: string; aiBusinessInfo?: string; aiFaqData?: any },
  ): Promise<{ message: string }> {
    // Verify facility exists and check access
    const facility = await this.prisma.facility.findUnique({
      where: { id },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot update AI customization for this facility');
    }

    // Update AI customization fields
    await this.prisma.facility.update({
      where: { id },
      data: {
        ...(data.aiGreeting !== undefined && { aiGreeting: data.aiGreeting }),
        ...(data.aiBusinessInfo !== undefined && { aiBusinessInfo: data.aiBusinessInfo }),
        ...(data.aiFaqData !== undefined && { aiFaqData: data.aiFaqData }),
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.FACILITY_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Facility AI customization updated: ${facility.name}`,
      entity: { type: 'FACILITY', id: facility.id },
      metadata: { hasGreeting: !!data.aiGreeting, hasBusinessInfo: !!data.aiBusinessInfo, hasFaqs: !!data.aiFaqData },
    });

    this.logger.log(`Facility AI customization updated: ${facility.name} (${facility.id})`);

    return { message: 'AI customization updated successfully' };
  }

  /**
   * Check WhatsApp connection status
   */
  async checkWhatsAppConnection(id: string): Promise<{ connected: boolean; lastSeen?: Date | null; message: string }> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot check WhatsApp connection for this facility');
    }

    return {
      connected: facility.whatsappConnected,
      lastSeen: facility.whatsappLastSeen,
      message: facility.whatsappConnected
        ? `WhatsApp connected (last seen: ${facility.whatsappLastSeen?.toISOString()})`
        : 'WhatsApp not connected. Please scan QR code with facility phone.',
    };
  }

  /**
   * Check Mercado Pago OAuth connection status
   */
  async checkMercadoPagoConnection(id: string): Promise<{ connected: boolean; expiresAt?: Date | null; message: string }> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot check Mercado Pago connection for this facility');
    }

    return {
      connected: facility.mpConnected,
      expiresAt: facility.mpTokenExpiresAt,
      message: facility.mpConnected
        ? `Mercado Pago connected via OAuth (token expires: ${facility.mpTokenExpiresAt?.toISOString()})`
        : 'Mercado Pago not connected. Please click "Connect with Mercado Pago" button.',
    };
  }

  /**
   * Generate QR code for facility's WhatsApp
   */
  async generateQrCode(id: string, options?: GenerateQrCodeDto): Promise<QrCodeResponseDto> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot access this facility');
    }

    if (!facility.whatsappPhone) {
      throw new BadRequestException('Facility does not have a WhatsApp number configured');
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = facility.whatsappPhone.replace(/[^0-9+]/g, '').replace(/^\+/, '');

    // Create WhatsApp deep link
    const message = options?.message || 'Hola, quiero hacer una reserva';
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Generate QR code as base64
    const size = options?.size || 300;
    const qrCode = await this.generateQrCodeBase64(whatsappLink, size);

    return {
      qrCode,
      whatsappLink,
      facilityName: facility.name,
      whatsappPhone: facility.whatsappPhone,
    };
  }

  /**
   * Generate QR code as base64 PNG
   * Uses a simple QR code generation approach without external dependencies
   */
  private async generateQrCodeBase64(data: string, size: number): Promise<string> {
    // Use Google Charts API for QR code generation (simple approach)
    // In production, consider using a library like 'qrcode' for offline generation
    const googleChartUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(data)}&choe=UTF-8`;

    try {
      const response = await fetch(googleChartUrl);
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error}`);
      // Fallback: return a placeholder or throw error
      throw new BadRequestException('Failed to generate QR code. Please try again.');
    }
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Convert facility to response DTO
   */
  private toResponseDto(facility: Facility, courtCount?: number): FacilityResponseDto {
    return {
      id: facility.id,
      tenantId: facility.tenantId,
      name: facility.name,
      address: facility.address,
      city: facility.city,
      country: facility.country,
      phone: facility.phone,
      email: facility.email,
      timezone: facility.timezone,
      currencyCode: facility.currencyCode,
      depositPercentage: facility.depositPercentage,
      cancellationHours: facility.cancellationHours,
      minBookingNoticeHours: facility.minBookingNoticeHours,
      maxBookingAdvanceDays: facility.maxBookingAdvanceDays,
      bufferMinutes: facility.bufferMinutes,
      sessionDurationMinutes: facility.sessionDurationMinutes,
      whatsappPhone: facility.whatsappPhone,
      status: facility.status,
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt,
      courtCount,
      credentials: this.getCredentialsStatus(facility),
    };
  }

  /**
   * Get connection status for integrations
   * NOTE: AI keys are centralized (backend .env) - NOT shown here
   */
  private getCredentialsStatus(facility: Facility): CredentialsStatusDto {
    return {
      whatsappConnected: facility.whatsappConnected,
      whatsappLastSeen: facility.whatsappLastSeen,
      mercadoPagoConnected: facility.mpConnected,
      mercadoPagoTokenExpires: facility.mpTokenExpiresAt,
      aiCustomized: !!(facility.aiGreeting || facility.aiBusinessInfo || facility.aiFaqData),
    };
  }

  /**
   * Get Baileys WhatsApp session data (for bot worker)
   * @internal - Only used by WhatsApp bot worker
   */
  async getWhatsAppSession(id: string): Promise<string | null> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      select: { whatsappSessionData: true },
    });

    if (!facility || !facility.whatsappSessionData) {
      return null;
    }

    // Decrypt Baileys session data
    return this.encryptionService.decrypt(facility.whatsappSessionData);
  }

  /**
   * Update Baileys WhatsApp session data (called by bot worker)
   * @internal - Only used by WhatsApp bot worker
   */
  async updateWhatsAppSession(id: string, sessionData: string): Promise<void> {
    // Encrypt session data before storing
    const encrypted = this.encryptionService.encrypt(sessionData);

    await this.prisma.facility.update({
      where: { id },
      data: {
        whatsappSessionData: encrypted,
        whatsappConnected: true,
        whatsappConnectedAt: new Date(),
        whatsappLastSeen: new Date(),
      },
    });

    this.logger.log(`WhatsApp session updated for facility: ${id}`);
  }

  /**
   * Get Mercado Pago OAuth access token (for payments service)
   * @internal - Only used by payments service
   */
  async getMercadoPagoToken(id: string): Promise<string | null> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      select: { mpAccessToken: true, mpConnected: true },
    });

    if (!facility || !facility.mpAccessToken || !facility.mpConnected) {
      return null;
    }

    // Decrypt OAuth access token
    return this.encryptionService.decrypt(facility.mpAccessToken);
  }

  /**
   * Complete facility registration (Super Admin only)
   * Creates tenant + facility + owner user + subscription in one transaction
   */
  async registerFacility(dto: RegisterFacilityDto): Promise<RegisterFacilityResponseDto> {
    this.logger.log(`Starting facility registration: ${dto.facilityName}`);

    // Generate unique slug from business name
    const baseSlug = dto.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists and add number if needed
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hash owner password
    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    // Calculate first due date (30 days from now if not provided)
    const firstDueDate = dto.firstDueDate
      ? new Date(dto.firstDueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
      // Create everything in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            businessName: dto.businessName,
            slug,
            status: 'ACTIVE',
          },
        });

        // 2. Create Owner User
        const owner = await tx.user.create({
          data: {
            email: dto.ownerEmail,
            passwordHash,
            fullName: dto.ownerName,
            phone: dto.ownerPhone,
            role: 'OWNER',
            tenantId: tenant.id,
            isActive: true,
          },
        });

        // 3. Create Facility
        const facility = await tx.facility.create({
          data: {
            tenantId: tenant.id,
            name: dto.facilityName,
            address: dto.address,
            city: dto.city,
            country: dto.country,
            phone: dto.facilityPhone,
            email: dto.facilityEmail,
            timezone: dto.timezone || 'America/Argentina/Buenos_Aires',
            currencyCode: dto.currencyCode || 'ARS',
            depositPercentage: dto.depositPercentage ?? 50,
            cancellationHours: dto.cancellationHours ?? 24,
            minBookingNoticeHours: dto.minBookingNoticeHours ?? 2,
            maxBookingAdvanceDays: dto.maxBookingAdvanceDays ?? 30,
            bufferMinutes: dto.bufferMinutes ?? 0,
            sessionDurationMinutes: dto.sessionDurationMinutes || [60, 90],
            whatsappPhone: dto.whatsappPhone,
            status: dto.status || 'ACTIVE',
          },
        });

        // 4. Create Subscription
        const subscription = await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planName: 'Standard',
            priceAmount: dto.monthlyPrice,
            currency: dto.currencyCode || 'ARS',
            billingCycle: 'MONTHLY',
            currentPeriodStart: new Date(),
            currentPeriodEnd: firstDueDate,
            status: 'ACTIVE',
            nextPaymentDate: firstDueDate,
            dueSoonDays: 5,
          },
        });

        return {
          tenant,
          owner,
          facility,
          subscription,
        };
      });

      this.logger.log(
        `Facility registered successfully: ${result.facility.id} (Tenant: ${result.tenant.id})`,
      );

      // Log audit event
      this.auditService.log({
        category: AuditEventCategory.FACILITY,
        eventType: AuditEventType.FACILITY_CREATED,
        action: 'Facility registered via Super Admin',
        tenantId: result.tenant.id,
        actor: {
          id: result.owner.id,
          type: 'USER',
          email: result.owner.email,
          role: result.owner.role,
        },
        metadata: {
          facilityId: result.facility.id,
          facilityName: result.facility.name,
          ownerName: result.owner.fullName,
          subscriptionId: result.subscription.id,
        },
      });

      // Emit WebSocket event
      this.wsGateway.emitToTenant(result.tenant.id, 'facility:registered', {
        facilityId: result.facility.id,
        facilityName: result.facility.name,
        tenantId: result.tenant.id,
      });

      return {
        tenantId: result.tenant.id,
        facilityId: result.facility.id,
        ownerId: result.owner.id,
        subscriptionId: result.subscription.id,
        ownerEmail: result.owner.email,
        facilityName: result.facility.name,
        message: 'Facility registered successfully',
      };
    } catch (error) {
      this.logger.error('Facility registration failed:', error);
      throw new BadRequestException(
        'Failed to register facility. Please try again.',
      );
    }
  }
}
