// Facilities Service
// Full facility management operations

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { TenantAwarePrismaService, TenantContextService } from '../../common/tenant';
import { AuditService, AuditEventType, AuditEventCategory } from '../../common/audit';
import { EncryptionService } from '../../common/encryption';
import { WsGateway } from '../../common/gateway';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  QueryFacilityDto,
  FacilityResponseDto,
  FacilityListResponseDto,
  CredentialsStatusDto,
  UpdateWhatsAppCredentialsDto,
  UpdateMercadoPagoCredentialsDto,
  UpdateGeminiCredentialsDto,
  UpdateWhisperCredentialsDto,
  TestCredentialsResultDto,
  CredentialType,
  QrCodeResponseDto,
  GenerateQrCodeDto,
} from './dto';
import { Facility, Prisma } from '@prisma/client';

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
   * Update facility credentials
   */
  async updateCredentials(
    id: string,
    type: CredentialType,
    credentials:
      | UpdateWhatsAppCredentialsDto
      | UpdateMercadoPagoCredentialsDto
      | UpdateGeminiCredentialsDto
      | UpdateWhisperCredentialsDto,
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
      throw new ForbiddenException('Cannot update credentials for this facility');
    }

    // Prepare encrypted data based on type
    let updateData: Prisma.FacilityUpdateInput = {};

    switch (type) {
      case 'whatsapp': {
        const waCredentials = credentials as UpdateWhatsAppCredentialsDto;
        updateData = {
          whatsappApiKey: this.encryptionService.encrypt(waCredentials.apiKey),
          whatsappApiSecret: this.encryptionService.encrypt(waCredentials.apiSecret),
          ...(waCredentials.webhookToken && {
            whatsappWebhookToken: this.encryptionService.encrypt(waCredentials.webhookToken),
          }),
        };
        break;
      }
      case 'mercadopago': {
        const mpCredentials = credentials as UpdateMercadoPagoCredentialsDto;
        updateData = {
          mercadopagoAccessToken: this.encryptionService.encrypt(mpCredentials.accessToken),
          mercadopagoPublicKey: this.encryptionService.encrypt(mpCredentials.publicKey),
        };
        break;
      }
      case 'gemini': {
        const geminiCredentials = credentials as UpdateGeminiCredentialsDto;
        updateData = {
          geminiApiKey: this.encryptionService.encrypt(geminiCredentials.apiKey),
        };
        break;
      }
      case 'whisper': {
        const whisperCredentials = credentials as UpdateWhisperCredentialsDto;
        updateData = {
          whisperApiKey: this.encryptionService.encrypt(whisperCredentials.apiKey),
        };
        break;
      }
      default:
        throw new BadRequestException(`Invalid credential type: ${type}`);
    }

    // Update credentials
    await this.prisma.facility.update({
      where: { id },
      data: updateData,
    });

    // Log audit event (don't log actual credentials)
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.FACILITY_CREDENTIALS_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Facility ${type} credentials updated: ${facility.name}`,
      entity: { type: 'FACILITY', id: facility.id },
      metadata: { credentialType: type },
    });

    this.logger.log(`Facility ${type} credentials updated: ${facility.name} (${facility.id})`);

    return { message: `${type} credentials updated successfully` };
  }

  /**
   * Test facility credentials
   */
  async testCredentials(id: string, type: CredentialType): Promise<TestCredentialsResultDto> {
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
      throw new ForbiddenException('Cannot test credentials for this facility');
    }

    // Test based on type
    switch (type) {
      case 'whatsapp':
        return this.testWhatsAppCredentials(facility);
      case 'mercadopago':
        return this.testMercadoPagoCredentials(facility);
      case 'gemini':
        return this.testGeminiCredentials(facility);
      case 'whisper':
        return this.testWhisperCredentials(facility);
      default:
        throw new BadRequestException(`Invalid credential type: ${type}`);
    }
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
   * Get credentials configuration status (not actual values)
   */
  private getCredentialsStatus(facility: Facility): CredentialsStatusDto {
    return {
      whatsapp: !!(facility.whatsappApiKey && facility.whatsappApiSecret),
      mercadoPago: !!(facility.mercadopagoAccessToken && facility.mercadopagoPublicKey),
      gemini: !!facility.geminiApiKey,
      whisper: !!facility.whisperApiKey,
    };
  }

  /**
   * Test WhatsApp credentials
   */
  private async testWhatsAppCredentials(facility: Facility): Promise<TestCredentialsResultDto> {
    if (!facility.whatsappApiKey || !facility.whatsappApiSecret) {
      return {
        success: false,
        message: 'WhatsApp credentials not configured',
      };
    }

    // TODO: Implement actual WhatsApp API test
    // For now, just check if credentials exist
    try {
      // const apiKey = this.encryptionService.decrypt(facility.whatsappApiKey);
      // const apiSecret = this.encryptionService.decrypt(facility.whatsappApiSecret);
      // Test the connection...

      return {
        success: true,
        message: 'WhatsApp credentials are configured (connection test not yet implemented)',
      };
    } catch {
      return {
        success: false,
        message: 'Failed to validate WhatsApp credentials',
      };
    }
  }

  /**
   * Test Mercado Pago credentials
   */
  private async testMercadoPagoCredentials(facility: Facility): Promise<TestCredentialsResultDto> {
    if (!facility.mercadopagoAccessToken || !facility.mercadopagoPublicKey) {
      return {
        success: false,
        message: 'Mercado Pago credentials not configured',
      };
    }

    // TODO: Implement actual Mercado Pago API test
    try {
      return {
        success: true,
        message: 'Mercado Pago credentials are configured (connection test not yet implemented)',
      };
    } catch {
      return {
        success: false,
        message: 'Failed to validate Mercado Pago credentials',
      };
    }
  }

  /**
   * Test Gemini credentials
   */
  private async testGeminiCredentials(facility: Facility): Promise<TestCredentialsResultDto> {
    if (!facility.geminiApiKey) {
      return {
        success: false,
        message: 'Gemini API key not configured',
      };
    }

    // TODO: Implement actual Gemini API test
    try {
      return {
        success: true,
        message: 'Gemini API key is configured (connection test not yet implemented)',
      };
    } catch {
      return {
        success: false,
        message: 'Failed to validate Gemini API key',
      };
    }
  }

  /**
   * Test Whisper credentials
   */
  private async testWhisperCredentials(facility: Facility): Promise<TestCredentialsResultDto> {
    if (!facility.whisperApiKey) {
      return {
        success: false,
        message: 'Whisper API key not configured',
      };
    }

    // TODO: Implement actual Whisper/OpenAI API test
    try {
      return {
        success: true,
        message: 'Whisper API key is configured (connection test not yet implemented)',
      };
    } catch {
      return {
        success: false,
        message: 'Failed to validate Whisper API key',
      };
    }
  }

  /**
   * Get decrypted credentials (for internal use only)
   */
  async getDecryptedCredentials(
    id: string,
    type: CredentialType,
  ): Promise<Record<string, string> | null> {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
    });

    if (!facility) return null;

    switch (type) {
      case 'whatsapp':
        if (!facility.whatsappApiKey || !facility.whatsappApiSecret) return null;
        return {
          apiKey: this.encryptionService.decrypt(facility.whatsappApiKey),
          apiSecret: this.encryptionService.decrypt(facility.whatsappApiSecret),
          webhookToken: facility.whatsappWebhookToken
            ? this.encryptionService.decrypt(facility.whatsappWebhookToken)
            : '',
        };
      case 'mercadopago':
        if (!facility.mercadopagoAccessToken || !facility.mercadopagoPublicKey) return null;
        return {
          accessToken: this.encryptionService.decrypt(facility.mercadopagoAccessToken),
          publicKey: this.encryptionService.decrypt(facility.mercadopagoPublicKey),
        };
      case 'gemini':
        if (!facility.geminiApiKey) return null;
        return {
          apiKey: this.encryptionService.decrypt(facility.geminiApiKey),
        };
      case 'whisper':
        if (!facility.whisperApiKey) return null;
        return {
          apiKey: this.encryptionService.decrypt(facility.whisperApiKey),
        };
      default:
        return null;
    }
  }
}
