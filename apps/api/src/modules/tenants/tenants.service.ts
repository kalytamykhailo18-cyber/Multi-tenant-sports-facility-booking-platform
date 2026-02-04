// Tenants Service
// Full tenant management operations (Super Admin only)

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantAwarePrismaService } from '../../common/tenant/tenant-aware-prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../common/audit/audit.types';
import { WsGateway } from '../../common/gateway/ws.gateway';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { TenantResponseDto, TenantListResponseDto } from './dto/tenant-response.dto';
import { Tenant, Prisma } from '@prisma/client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantAwarePrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {}

  /**
   * Find all tenants with pagination and filtering (Super Admin only)
   */
  async findAll(query: QueryTenantDto): Promise<TenantListResponseDto> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TenantWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              facilities: true,
              users: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Map to response DTOs with aggregated data
    const items: TenantResponseDto[] = tenants.map((tenant) => ({
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      facilityCount: tenant._count.facilities,
      userCount: tenant._count.users,
      // TODO: Add subscription status check when Subscription model is implemented
      hasActiveSubscription: undefined,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find tenant by ID with aggregated data
   */
  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return {
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      facilityCount: tenant._count.facilities,
      userCount: tenant._count.users,
      hasActiveSubscription: undefined,
    };
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }

    return {
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      facilityCount: tenant._count.facilities,
      userCount: tenant._count.users,
      hasActiveSubscription: undefined,
    };
  }

  /**
   * Create a new tenant
   */
  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const { businessName, slug, status } = dto;

    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(businessName);

    // Check slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: finalSlug },
    });

    if (existingTenant) {
      throw new ConflictException(`Tenant with slug "${finalSlug}" already exists`);
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        businessName,
        slug: finalSlug,
        status: status || 'ACTIVE',
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.TENANT,
      eventType: AuditEventType.TENANT_CREATED,
      actor: { type: 'SYSTEM', id: null },
      action: `Tenant created: ${tenant.businessName}`,
      entity: { type: 'TENANT', id: tenant.id },
      metadata: { businessName, slug: finalSlug },
    });

    this.logger.log(`Tenant created: ${tenant.businessName} (${tenant.id})`);

    return {
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      facilityCount: 0,
      userCount: 0,
      hasActiveSubscription: undefined,
    };
  }

  /**
   * Update a tenant
   */
  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    // Verify tenant exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // If slug is being changed, check uniqueness
    if (dto.slug && dto.slug !== existingTenant.slug) {
      const slugExists = await this.prisma.tenant.findUnique({
        where: { slug: dto.slug },
      });

      if (slugExists) {
        throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
      }
    }

    // Update tenant
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.businessName && { businessName: dto.businessName }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.TENANT,
      eventType: AuditEventType.TENANT_UPDATED,
      tenantId: tenant.id,
      actor: { type: 'SYSTEM', id: null },
      action: `Tenant updated: ${tenant.businessName}`,
      entity: { type: 'TENANT', id: tenant.id },
      metadata: { changes: dto },
      changes: { before: existingTenant as Record<string, unknown>, after: tenant as Record<string, unknown> },
    });

    this.logger.log(`Tenant updated: ${tenant.businessName} (${tenant.id})`);

    // Emit socket event for real-time updates (Super Admin dashboard)
    // Note: Tenant updates are emitted to a special admin room
    // this.wsGateway.emitToTenant(tenant.id, 'tenant:updated', tenant);

    return {
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      facilityCount: tenant._count.facilities,
      userCount: tenant._count.users,
      hasActiveSubscription: undefined,
    };
  }

  /**
   * Delete a tenant (soft delete by setting status to CANCELLED)
   * Hard delete only if no facilities, users, or subscriptions
   */
  async delete(id: string): Promise<{ message: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Check for associated data
    if (tenant._count.facilities > 0 || tenant._count.users > 0) {
      // Soft delete - just change status to CANCELLED
      await this.prisma.tenant.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      this.auditService.log({
        category: AuditEventCategory.TENANT,
        eventType: AuditEventType.TENANT_DELETED,
        tenantId: tenant.id,
        actor: { type: 'SYSTEM', id: null },
        action: `Tenant soft deleted (has associated data): ${tenant.businessName}`,
        entity: { type: 'TENANT', id: tenant.id },
        metadata: {
          deleteType: 'soft',
          facilitiesCount: tenant._count.facilities,
          usersCount: tenant._count.users,
        },
      });

      this.logger.log(`Tenant soft deleted: ${tenant.businessName} (${tenant.id})`);

      return { message: `Tenant "${tenant.businessName}" has been deactivated (status: CANCELLED)` };
    }

    // Hard delete - no associated data
    await this.prisma.tenant.delete({
      where: { id },
    });

    this.auditService.log({
      category: AuditEventCategory.TENANT,
      eventType: AuditEventType.TENANT_DELETED,
      actor: { type: 'SYSTEM', id: null },
      action: `Tenant permanently deleted: ${tenant.businessName}`,
      entity: { type: 'TENANT', id: tenant.id },
      metadata: { deleteType: 'hard' },
    });

    this.logger.log(`Tenant permanently deleted: ${tenant.businessName} (${tenant.id})`);

    return { message: `Tenant "${tenant.businessName}" has been permanently deleted` };
  }

  /**
   * Suspend a tenant (sets status to SUSPENDED)
   */
  async suspend(id: string, reason?: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (tenant.status === 'SUSPENDED') {
      throw new BadRequestException('Tenant is already suspended');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });

    this.auditService.log({
      category: AuditEventCategory.TENANT,
      eventType: AuditEventType.TENANT_SUSPENDED,
      tenantId: tenant.id,
      actor: { type: 'SYSTEM', id: null },
      action: `Tenant suspended: ${tenant.businessName}`,
      entity: { type: 'TENANT', id: tenant.id },
      metadata: { reason: reason || 'No reason provided' },
    });

    this.logger.log(`Tenant suspended: ${tenant.businessName} (${tenant.id})`);

    return {
      id: updated.id,
      businessName: updated.businessName,
      slug: updated.slug,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      facilityCount: updated._count.facilities,
      userCount: updated._count.users,
      hasActiveSubscription: undefined,
    };
  }

  /**
   * Reactivate a suspended tenant
   */
  async reactivate(id: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (tenant.status === 'ACTIVE') {
      throw new BadRequestException('Tenant is already active');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });

    this.auditService.log({
      category: AuditEventCategory.TENANT,
      eventType: AuditEventType.TENANT_REACTIVATED,
      tenantId: tenant.id,
      actor: { type: 'SYSTEM', id: null },
      action: `Tenant reactivated: ${tenant.businessName}`,
      entity: { type: 'TENANT', id: tenant.id },
    });

    this.logger.log(`Tenant reactivated: ${tenant.businessName} (${tenant.id})`);

    return {
      id: updated.id,
      businessName: updated.businessName,
      slug: updated.slug,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      facilityCount: updated._count.facilities,
      userCount: updated._count.users,
      hasActiveSubscription: undefined,
    };
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Generate URL-friendly slug from business name
   */
  private generateSlug(businessName: string): string {
    return businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Get users for a specific tenant (uses tenant-aware prisma)
   */
  async getUsersForTenant(tenantId: string) {
    this.logger.log(`Fetching users for tenant: ${tenantId}`);

    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== tenantId) {
      throw new ForbiddenException('Cannot access data for another tenant');
    }

    const users = await this.tenantPrisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      tenantId,
      count: users.length,
      users,
    };
  }

  /**
   * Get facilities for a specific tenant
   */
  async getFacilitiesForTenant(tenantId: string) {
    this.logger.log(`Fetching facilities for tenant: ${tenantId}`);

    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== tenantId) {
      throw new ForbiddenException('Cannot access data for another tenant');
    }

    const facilities = await this.tenantPrisma.facility.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        tenantId: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      tenantId,
      count: facilities.length,
      facilities,
    };
  }
}
