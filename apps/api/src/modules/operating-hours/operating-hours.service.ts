// Operating Hours Service
// Full operating hours and special hours management operations

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { TenantContextService } from '../../common/tenant';
import { AuditService, AuditEventType, AuditEventCategory } from '../../common/audit';
import { WsGateway } from '../../common/gateway';
import {
  CreateOperatingHoursDto,
  UpdateOperatingHoursDto,
  BulkUpdateOperatingHoursDto,
  DayScheduleUpdateDto,
  OperatingHoursResponseDto,
  WeeklyScheduleResponseDto,
  CreateSpecialHoursDto,
  UpdateSpecialHoursDto,
  SpecialHoursResponseDto,
  SpecialHoursListResponseDto,
  QuerySpecialHoursDto,
} from './dto';
import { OperatingHours, SpecialHours, Prisma } from '@prisma/client';

// Day names for display
const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

@Injectable()
export class OperatingHoursService {
  private readonly logger = new Logger(OperatingHoursService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {}

  // ==========================================
  // Operating Hours Methods
  // ==========================================

  /**
   * Create default operating hours for a facility (all 7 days)
   * This is typically called when a new facility is created
   */
  async createDefaultHours(
    facilityId: string,
    options?: {
      defaultOpenTime?: string;
      defaultCloseTime?: string;
      defaultSessionDuration?: number;
      defaultBufferMinutes?: number;
    },
  ): Promise<OperatingHoursResponseDto[]> {
    const {
      defaultOpenTime = '08:00',
      defaultCloseTime = '23:00',
      defaultSessionDuration = 60,
      defaultBufferMinutes = 0,
    } = options || {};

    // Verify facility exists and get tenant info
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot create operating hours for this facility');
    }

    // Check if operating hours already exist
    const existingHours = await this.prisma.operatingHours.findMany({
      where: { facilityId },
    });

    if (existingHours.length > 0) {
      throw new BadRequestException('Operating hours already exist for this facility');
    }

    // Create operating hours for all 7 days
    const daysToCreate = Array.from({ length: 7 }, (_, i) => ({
      tenantId: facility.tenantId,
      facilityId,
      dayOfWeek: i,
      openTime: defaultOpenTime,
      closeTime: defaultCloseTime,
      isClosed: false,
      sessionDurationMinutes: defaultSessionDuration,
      bufferMinutes: defaultBufferMinutes,
    }));

    await this.prisma.operatingHours.createMany({
      data: daysToCreate,
    });

    // Fetch the created hours
    const createdHours = await this.prisma.operatingHours.findMany({
      where: { facilityId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.CALENDAR_HOURS_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Default operating hours created for facility: ${facility.name}`,
      entity: { type: 'FACILITY', id: facilityId },
      metadata: { defaultOpenTime, defaultCloseTime, defaultSessionDuration, defaultBufferMinutes },
    });

    this.logger.log(`Default operating hours created for facility: ${facility.name} (${facilityId})`);

    return createdHours.map(this.toOperatingHoursResponseDto);
  }

  /**
   * Get operating hours for a facility
   */
  async findByFacility(facilityId: string): Promise<WeeklyScheduleResponseDto> {
    // Verify facility exists and check access
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot access operating hours for this facility');
    }

    const operatingHours = await this.prisma.operatingHours.findMany({
      where: { facilityId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // If no hours exist, create defaults
    if (operatingHours.length === 0) {
      const defaultHours = await this.createDefaultHours(facilityId);
      return {
        facilityId,
        days: defaultHours,
        defaultSessionDurationMinutes: facility.sessionDurationMinutes?.[0] ?? 60,
        defaultBufferMinutes: facility.bufferMinutes,
      };
    }

    return {
      facilityId,
      days: operatingHours.map(this.toOperatingHoursResponseDto),
      defaultSessionDurationMinutes: facility.sessionDurationMinutes?.[0] ?? 60,
      defaultBufferMinutes: facility.bufferMinutes,
    };
  }

  /**
   * Update a single day's operating hours
   */
  async update(id: string, dto: UpdateOperatingHoursDto): Promise<OperatingHoursResponseDto> {
    // Verify operating hours exist
    const existingHours = await this.prisma.operatingHours.findUnique({
      where: { id },
    });

    if (!existingHours) {
      throw new NotFoundException(`Operating hours with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== existingHours.tenantId) {
      throw new ForbiddenException('Cannot update these operating hours');
    }

    // Validate time range if both provided
    if (dto.openTime && dto.closeTime) {
      if (!this.isValidTimeRange(dto.openTime, dto.closeTime)) {
        throw new BadRequestException('Close time must be after open time');
      }
    }

    // Build update data
    const updateData: Prisma.OperatingHoursUpdateInput = {};

    if (dto.openTime !== undefined) updateData.openTime = dto.openTime;
    if (dto.closeTime !== undefined) updateData.closeTime = dto.closeTime;
    if (dto.isClosed !== undefined) updateData.isClosed = dto.isClosed;
    if (dto.sessionDurationMinutes !== undefined) {
      updateData.sessionDurationMinutes = dto.sessionDurationMinutes;
    }
    if (dto.bufferMinutes !== undefined) updateData.bufferMinutes = dto.bufferMinutes;

    // Update
    const updatedHours = await this.prisma.operatingHours.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.CALENDAR_HOURS_UPDATED,
      tenantId: updatedHours.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Operating hours updated for day ${DAY_NAMES_ES[updatedHours.dayOfWeek]}`,
      entity: { type: 'OPERATING_HOURS', id: updatedHours.id },
      metadata: { dayOfWeek: updatedHours.dayOfWeek, changes: dto },
      changes: {
        before: existingHours as unknown as Record<string, unknown>,
        after: updatedHours as unknown as Record<string, unknown>,
      },
    });

    this.logger.log(`Operating hours updated for facility ${updatedHours.facilityId}, day ${updatedHours.dayOfWeek}`);

    // Emit socket event
    this.wsGateway.emitToTenant(updatedHours.tenantId, 'operating_hours:updated', {
      facilityId: updatedHours.facilityId,
      dayOfWeek: updatedHours.dayOfWeek,
    });

    return this.toOperatingHoursResponseDto(updatedHours);
  }

  /**
   * Bulk update operating hours for all days of the week
   */
  async bulkUpdate(facilityId: string, dto: BulkUpdateOperatingHoursDto): Promise<WeeklyScheduleResponseDto> {
    // Verify facility exists and check access
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot update operating hours for this facility');
    }

    // Validate all days have correct dayOfWeek values
    const providedDays = new Set(dto.days.map((d) => d.dayOfWeek));
    if (dto.days.length !== providedDays.size) {
      throw new BadRequestException('Duplicate days of week provided');
    }

    // Validate time ranges
    for (const day of dto.days) {
      if (!day.isClosed && !this.isValidTimeRange(day.openTime, day.closeTime)) {
        throw new BadRequestException(`Invalid time range for day ${day.dayOfWeek}: close time must be after open time`);
      }
    }

    // Upsert each day's schedule using transaction
    const updateResults = await this.prisma.$transaction(
      dto.days.map((day) =>
        this.prisma.operatingHours.upsert({
          where: {
            facilityId_dayOfWeek: {
              facilityId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            openTime: day.openTime,
            closeTime: day.closeTime,
            isClosed: day.isClosed,
            sessionDurationMinutes: day.sessionDurationMinutes ?? dto.defaultSessionDurationMinutes ?? 60,
            bufferMinutes: day.bufferMinutes ?? dto.defaultBufferMinutes ?? 0,
          },
          create: {
            tenantId: facility.tenantId,
            facilityId,
            dayOfWeek: day.dayOfWeek,
            openTime: day.openTime,
            closeTime: day.closeTime,
            isClosed: day.isClosed,
            sessionDurationMinutes: day.sessionDurationMinutes ?? dto.defaultSessionDurationMinutes ?? 60,
            bufferMinutes: day.bufferMinutes ?? dto.defaultBufferMinutes ?? 0,
          },
        }),
      ),
    );

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.CALENDAR_HOURS_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Weekly schedule updated for facility: ${facility.name}`,
      entity: { type: 'FACILITY', id: facilityId },
      metadata: { daysUpdated: dto.days.length },
    });

    this.logger.log(`Weekly schedule updated for facility: ${facility.name} (${facilityId})`);

    // Emit socket event
    this.wsGateway.emitToTenant(facility.tenantId, 'operating_hours:bulk_updated', {
      facilityId,
    });

    // Return the full schedule
    return this.findByFacility(facilityId);
  }

  // ==========================================
  // Special Hours Methods
  // ==========================================

  /**
   * Create special hours (holiday/closure)
   */
  async createSpecialHours(dto: CreateSpecialHoursDto): Promise<SpecialHoursResponseDto> {
    const { facilityId, date, openTime, closeTime, isClosed, reason } = dto;

    // Verify facility exists and get tenant info
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot create special hours for this facility');
    }

    // Check if special hours already exist for this date
    const existingSpecialHours = await this.prisma.specialHours.findUnique({
      where: {
        facilityId_date: {
          facilityId,
          date: new Date(date),
        },
      },
    });

    if (existingSpecialHours) {
      throw new BadRequestException('Special hours already exist for this date');
    }

    // Validate time range if not closed
    if (!isClosed && openTime && closeTime && !this.isValidTimeRange(openTime, closeTime)) {
      throw new BadRequestException('Close time must be after open time');
    }

    // Create special hours
    const specialHours = await this.prisma.specialHours.create({
      data: {
        tenantId: facility.tenantId,
        facilityId,
        date: new Date(date),
        openTime: isClosed ? null : openTime,
        closeTime: isClosed ? null : closeTime,
        isClosed,
        reason,
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.CALENDAR_HOURS_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Special hours created: ${isClosed ? 'Closed' : 'Modified hours'} on ${date}`,
      entity: { type: 'SPECIAL_HOURS', id: specialHours.id },
      metadata: { date, isClosed, reason },
    });

    this.logger.log(`Special hours created for facility ${facilityId} on ${date}`);

    // Emit socket event
    this.wsGateway.emitToTenant(facility.tenantId, 'special_hours:created', {
      facilityId,
      date,
      isClosed,
    });

    return this.toSpecialHoursResponseDto(specialHours);
  }

  /**
   * Update special hours
   */
  async updateSpecialHours(id: string, dto: UpdateSpecialHoursDto): Promise<SpecialHoursResponseDto> {
    // Verify special hours exist
    const existingHours = await this.prisma.specialHours.findUnique({
      where: { id },
    });

    if (!existingHours) {
      throw new NotFoundException(`Special hours with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== existingHours.tenantId) {
      throw new ForbiddenException('Cannot update these special hours');
    }

    // Validate time range if updating times
    const isClosed = dto.isClosed ?? existingHours.isClosed;
    const openTime = dto.openTime ?? existingHours.openTime;
    const closeTime = dto.closeTime ?? existingHours.closeTime;

    if (!isClosed && openTime && closeTime && !this.isValidTimeRange(openTime, closeTime)) {
      throw new BadRequestException('Close time must be after open time');
    }

    // Build update data
    const updateData: Prisma.SpecialHoursUpdateInput = {};

    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.openTime !== undefined) updateData.openTime = dto.openTime;
    if (dto.closeTime !== undefined) updateData.closeTime = dto.closeTime;
    if (dto.isClosed !== undefined) {
      updateData.isClosed = dto.isClosed;
      if (dto.isClosed) {
        updateData.openTime = null;
        updateData.closeTime = null;
      }
    }
    if (dto.reason !== undefined) updateData.reason = dto.reason;

    // Update
    const updatedHours = await this.prisma.specialHours.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.CALENDAR_HOURS_UPDATED,
      tenantId: updatedHours.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Special hours updated for date ${updatedHours.date.toISOString().split('T')[0]}`,
      entity: { type: 'SPECIAL_HOURS', id: updatedHours.id },
      metadata: { changes: dto },
    });

    this.logger.log(`Special hours updated: ${id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(updatedHours.tenantId, 'special_hours:updated', {
      facilityId: updatedHours.facilityId,
      id: updatedHours.id,
    });

    return this.toSpecialHoursResponseDto(updatedHours);
  }

  /**
   * Delete special hours
   */
  async deleteSpecialHours(id: string): Promise<{ message: string }> {
    // Verify special hours exist
    const specialHours = await this.prisma.specialHours.findUnique({
      where: { id },
    });

    if (!specialHours) {
      throw new NotFoundException(`Special hours with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== specialHours.tenantId) {
      throw new ForbiddenException('Cannot delete these special hours');
    }

    // Delete
    await this.prisma.specialHours.delete({
      where: { id },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.CALENDAR_HOURS_UPDATED,
      tenantId: specialHours.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Special hours deleted for date ${specialHours.date.toISOString().split('T')[0]}`,
      entity: { type: 'SPECIAL_HOURS', id },
      metadata: { reason: specialHours.reason },
    });

    this.logger.log(`Special hours deleted: ${id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(specialHours.tenantId, 'special_hours:deleted', {
      facilityId: specialHours.facilityId,
      id,
      date: specialHours.date,
    });

    return { message: 'Special hours deleted successfully' };
  }

  /**
   * Get special hours for a facility
   */
  async findSpecialHoursByFacility(
    facilityId: string,
    query?: QuerySpecialHoursDto,
  ): Promise<SpecialHoursListResponseDto> {
    // Verify facility exists and check access
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot access special hours for this facility');
    }

    // Build where clause
    const where: Prisma.SpecialHoursWhereInput = { facilityId };

    if (query?.startDate) {
      where.date = { ...(where.date as object), gte: new Date(query.startDate) };
    }

    if (query?.endDate) {
      where.date = { ...(where.date as object), lte: new Date(query.endDate) };
    }

    if (query?.isClosed !== undefined) {
      where.isClosed = query.isClosed;
    }

    // By default, exclude past dates unless explicitly requested
    if (!query?.includePast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = { ...(where.date as object), gte: today };
    }

    const [items, total] = await Promise.all([
      this.prisma.specialHours.findMany({
        where,
        orderBy: { date: 'asc' },
      }),
      this.prisma.specialHours.count({ where }),
    ]);

    return {
      items: items.map(this.toSpecialHoursResponseDto),
      total,
    };
  }

  /**
   * Get effective hours for a specific date (considering special hours)
   */
  async getEffectiveHours(
    facilityId: string,
    date: Date,
  ): Promise<{
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
    sessionDurationMinutes: number;
    bufferMinutes: number;
    isSpecialHours: boolean;
    reason?: string;
  }> {
    // Check for special hours first
    const specialHours = await this.prisma.specialHours.findUnique({
      where: {
        facilityId_date: {
          facilityId,
          date,
        },
      },
    });

    if (specialHours) {
      // Get regular hours for session duration and buffer
      const dayOfWeek = date.getDay();
      const regularHours = await this.prisma.operatingHours.findUnique({
        where: {
          facilityId_dayOfWeek: {
            facilityId,
            dayOfWeek,
          },
        },
      });

      return {
        isOpen: !specialHours.isClosed,
        openTime: specialHours.openTime,
        closeTime: specialHours.closeTime,
        sessionDurationMinutes: regularHours?.sessionDurationMinutes ?? 60,
        bufferMinutes: regularHours?.bufferMinutes ?? 0,
        isSpecialHours: true,
        reason: specialHours.reason ?? undefined,
      };
    }

    // Use regular operating hours
    const dayOfWeek = date.getDay();
    const regularHours = await this.prisma.operatingHours.findUnique({
      where: {
        facilityId_dayOfWeek: {
          facilityId,
          dayOfWeek,
        },
      },
    });

    if (!regularHours) {
      return {
        isOpen: false,
        openTime: null,
        closeTime: null,
        sessionDurationMinutes: 60,
        bufferMinutes: 0,
        isSpecialHours: false,
      };
    }

    return {
      isOpen: !regularHours.isClosed,
      openTime: regularHours.openTime,
      closeTime: regularHours.closeTime,
      sessionDurationMinutes: regularHours.sessionDurationMinutes,
      bufferMinutes: regularHours.bufferMinutes,
      isSpecialHours: false,
    };
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Validate time range
   */
  private isValidTimeRange(openTime: string, closeTime: string): boolean {
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Allow close time to be before open time for venues that stay open past midnight
    // But for most facilities, close time should be after open time
    return closeMinutes > openMinutes;
  }

  /**
   * Convert operating hours to response DTO
   */
  private toOperatingHoursResponseDto(hours: OperatingHours): OperatingHoursResponseDto {
    return {
      id: hours.id,
      tenantId: hours.tenantId,
      facilityId: hours.facilityId,
      dayOfWeek: hours.dayOfWeek,
      openTime: hours.openTime,
      closeTime: hours.closeTime,
      isClosed: hours.isClosed,
      sessionDurationMinutes: hours.sessionDurationMinutes,
      bufferMinutes: hours.bufferMinutes,
      createdAt: hours.createdAt,
      updatedAt: hours.updatedAt,
      dayName: DAY_NAMES_ES[hours.dayOfWeek],
    };
  }

  /**
   * Convert special hours to response DTO
   */
  private toSpecialHoursResponseDto(hours: SpecialHours): SpecialHoursResponseDto {
    // Format date for display
    const dateObj = new Date(hours.date);
    const day = dateObj.getDate();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const formattedDate = `${day} de ${monthNames[dateObj.getMonth()]}`;

    return {
      id: hours.id,
      tenantId: hours.tenantId,
      facilityId: hours.facilityId,
      date: hours.date,
      openTime: hours.openTime,
      closeTime: hours.closeTime,
      isClosed: hours.isClosed,
      reason: hours.reason,
      createdAt: hours.createdAt,
      updatedAt: hours.updatedAt,
      formattedDate,
    };
  }
}
