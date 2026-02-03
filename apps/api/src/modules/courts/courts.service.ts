// Courts Service
// Full court management operations

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
  CreateCourtDto,
  UpdateCourtDto,
  UpdateCourtStatusDto,
  ReorderCourtsDto,
  QueryCourtDto,
  CourtResponseDto,
  CourtListResponseDto,
} from './dto';
import { Court, CourtStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CourtsService {
  private readonly logger = new Logger(CourtsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {}

  /**
   * Create a new court
   */
  async create(dto: CreateCourtDto): Promise<CourtResponseDto> {
    const {
      facilityId,
      name,
      sportType = 'SOCCER',
      description,
      surfaceType,
      isIndoor = false,
      basePricePerHour,
      status = 'ACTIVE',
      displayOrder,
    } = dto;

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
      throw new ForbiddenException('Cannot create court for this facility');
    }

    // Get next display order if not provided
    let finalDisplayOrder = displayOrder;
    if (finalDisplayOrder === undefined) {
      const maxOrder = await this.prisma.court.aggregate({
        where: { facilityId },
        _max: { displayOrder: true },
      });
      finalDisplayOrder = (maxOrder._max.displayOrder ?? -1) + 1;
    }

    // Create court
    const court = await this.prisma.court.create({
      data: {
        tenantId: facility.tenantId,
        facilityId,
        name,
        sportType,
        description,
        surfaceType,
        isIndoor,
        basePricePerHour: new Decimal(basePricePerHour),
        status,
        displayOrder: finalDisplayOrder,
      },
      include: {
        facility: {
          select: {
            name: true,
            currencyCode: true,
          },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.COURT_CREATED,
      tenantId: court.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Court created: ${court.name}`,
      entity: { type: 'COURT', id: court.id },
      metadata: { name, facilityId, sportType },
    });

    this.logger.log(`Court created: ${court.name} (${court.id})`);

    // Emit socket event for real-time updates
    this.wsGateway.emitToTenant(court.tenantId, 'court:created', {
      id: court.id,
      name: court.name,
      facilityId: court.facilityId,
    });

    return this.toResponseDto(court, court.facility);
  }

  /**
   * Find all courts with pagination and filtering
   */
  async findAll(query: QueryCourtDto): Promise<CourtListResponseDto> {
    const {
      page = 1,
      limit = 10,
      facilityId,
      status,
      sportType,
      isIndoor,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CourtWhereInput = {};

    // Filter by tenant
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId) {
      where.tenantId = contextTenantId;
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (status) {
      where.status = status;
    }

    if (sportType) {
      where.sportType = sportType;
    }

    if (isIndoor !== undefined) {
      where.isIndoor = isIndoor;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [courts, total] = await Promise.all([
      this.prisma.court.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          facility: {
            select: {
              name: true,
              currencyCode: true,
            },
          },
        },
      }),
      this.prisma.court.count({ where }),
    ]);

    // Map to response DTOs
    const items: CourtResponseDto[] = courts.map((court) =>
      this.toResponseDto(court, court.facility),
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
   * Find courts by facility ID (commonly used, simplified)
   */
  async findByFacility(facilityId: string): Promise<CourtResponseDto[]> {
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
      throw new ForbiddenException('Cannot access courts for this facility');
    }

    const courts = await this.prisma.court.findMany({
      where: { facilityId },
      orderBy: { displayOrder: 'asc' },
      include: {
        facility: {
          select: {
            name: true,
            currencyCode: true,
          },
        },
      },
    });

    return courts.map((court) => this.toResponseDto(court, court.facility));
  }

  /**
   * Find court by ID
   */
  async findById(id: string): Promise<CourtResponseDto> {
    const court = await this.prisma.court.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            name: true,
            currencyCode: true,
          },
        },
      },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== court.tenantId) {
      throw new ForbiddenException('Cannot access this court');
    }

    return this.toResponseDto(court, court.facility);
  }

  /**
   * Update a court
   */
  async update(id: string, dto: UpdateCourtDto): Promise<CourtResponseDto> {
    // Verify court exists and check access
    const existingCourt = await this.prisma.court.findUnique({
      where: { id },
    });

    if (!existingCourt) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== existingCourt.tenantId) {
      throw new ForbiddenException('Cannot update this court');
    }

    // Build update data
    const updateData: Prisma.CourtUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sportType !== undefined) updateData.sportType = dto.sportType;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.surfaceType !== undefined) updateData.surfaceType = dto.surfaceType;
    if (dto.isIndoor !== undefined) updateData.isIndoor = dto.isIndoor;
    if (dto.basePricePerHour !== undefined) {
      updateData.basePricePerHour = new Decimal(dto.basePricePerHour);
    }
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.displayOrder !== undefined) updateData.displayOrder = dto.displayOrder;

    // Update court
    const court = await this.prisma.court.update({
      where: { id },
      data: updateData,
      include: {
        facility: {
          select: {
            name: true,
            currencyCode: true,
          },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.COURT_UPDATED,
      tenantId: court.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Court updated: ${court.name}`,
      entity: { type: 'COURT', id: court.id },
      metadata: { changes: dto },
      changes: {
        before: existingCourt as unknown as Record<string, unknown>,
        after: court as unknown as Record<string, unknown>,
      },
    });

    this.logger.log(`Court updated: ${court.name} (${court.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(court.tenantId, 'court:updated', {
      id: court.id,
      name: court.name,
      facilityId: court.facilityId,
    });

    return this.toResponseDto(court, court.facility);
  }

  /**
   * Update court status
   */
  async updateStatus(id: string, dto: UpdateCourtStatusDto): Promise<CourtResponseDto> {
    // Verify court exists and check access
    const existingCourt = await this.prisma.court.findUnique({
      where: { id },
    });

    if (!existingCourt) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== existingCourt.tenantId) {
      throw new ForbiddenException('Cannot update this court');
    }

    // If setting to maintenance/inactive, could check for future bookings
    // For now, allow status change (bookings should be handled separately)

    // Update status
    const court = await this.prisma.court.update({
      where: { id },
      data: { status: dto.status },
      include: {
        facility: {
          select: {
            name: true,
            currencyCode: true,
          },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.COURT_STATUS_CHANGED,
      tenantId: court.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Court status changed: ${court.name} -> ${dto.status}`,
      entity: { type: 'COURT', id: court.id },
      metadata: { oldStatus: existingCourt.status, newStatus: dto.status },
    });

    this.logger.log(`Court status changed: ${court.name} (${court.id}) -> ${dto.status}`);

    // Emit socket event
    this.wsGateway.emitToTenant(court.tenantId, 'court:status_changed', {
      id: court.id,
      name: court.name,
      status: court.status,
      facilityId: court.facilityId,
    });

    return this.toResponseDto(court, court.facility);
  }

  /**
   * Reorder courts within a facility
   */
  async reorder(dto: ReorderCourtsDto): Promise<CourtResponseDto[]> {
    const { facilityId, courtIds } = dto;

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
      throw new ForbiddenException('Cannot reorder courts for this facility');
    }

    // Verify all courts belong to the facility
    const courts = await this.prisma.court.findMany({
      where: { facilityId, id: { in: courtIds } },
    });

    if (courts.length !== courtIds.length) {
      throw new BadRequestException('Some court IDs are invalid or do not belong to this facility');
    }

    // Update display order for each court
    const updatePromises = courtIds.map((courtId, index) =>
      this.prisma.court.update({
        where: { id: courtId },
        data: { displayOrder: index },
      }),
    );

    await Promise.all(updatePromises);

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.COURT_UPDATED,
      tenantId: facility.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Courts reordered for facility: ${facility.name}`,
      entity: { type: 'FACILITY', id: facilityId },
      metadata: { courtIds },
    });

    this.logger.log(`Courts reordered for facility: ${facility.name} (${facilityId})`);

    // Emit socket event
    this.wsGateway.emitToTenant(facility.tenantId, 'courts:reordered', {
      facilityId,
      courtIds,
    });

    // Return updated courts
    return this.findByFacility(facilityId);
  }

  /**
   * Delete a court
   */
  async delete(id: string): Promise<{ message: string }> {
    const court = await this.prisma.court.findUnique({
      where: { id },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== court.tenantId) {
      throw new ForbiddenException('Cannot delete this court');
    }

    // TODO: Check for associated bookings when booking model exists
    // For now, soft delete by setting status to INACTIVE
    await this.prisma.court.update({
      where: { id },
      data: { status: CourtStatus.INACTIVE },
    });

    this.auditService.log({
      category: AuditEventCategory.FACILITY,
      eventType: AuditEventType.COURT_STATUS_CHANGED,
      tenantId: court.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Court deactivated: ${court.name}`,
      entity: { type: 'COURT', id: court.id },
      metadata: { deleteType: 'soft' },
    });

    this.logger.log(`Court deactivated: ${court.name} (${court.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(court.tenantId, 'court:deleted', {
      id: court.id,
      facilityId: court.facilityId,
    });

    return { message: `Court "${court.name}" has been deactivated` };
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Convert court to response DTO
   */
  private toResponseDto(
    court: Court,
    facility?: { name: string; currencyCode: string } | null,
  ): CourtResponseDto {
    return {
      id: court.id,
      tenantId: court.tenantId,
      facilityId: court.facilityId,
      name: court.name,
      sportType: court.sportType,
      description: court.description,
      surfaceType: court.surfaceType,
      isIndoor: court.isIndoor,
      basePricePerHour: Number(court.basePricePerHour),
      status: court.status,
      displayOrder: court.displayOrder,
      createdAt: court.createdAt,
      updatedAt: court.updatedAt,
      facilityName: facility?.name,
      currencyCode: facility?.currencyCode,
    };
  }
}
