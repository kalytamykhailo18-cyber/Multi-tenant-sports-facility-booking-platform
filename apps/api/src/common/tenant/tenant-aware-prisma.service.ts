// Tenant-Aware Prisma Service
// Provides Prisma queries that automatically filter by tenant

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';
import { Prisma } from '@prisma/client';

// Models that have tenantId field
const TENANT_SCOPED_MODELS = [
  'user',
  'facility',
  'court',
  // Add more models as they are created
  // 'booking',
  // 'customer',
  // 'payment',
  // 'subscription',
  // 'operatingHours',
  // 'specialHours',
  // 'waitingList',
  // 'playerProfile',
] as const;

type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

// Models that don't have tenantId field
const NON_TENANT_MODELS = ['tenant'] as const;

@Injectable()
export class TenantAwarePrismaService {
  private readonly logger = new Logger(TenantAwarePrismaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Gets the raw Prisma client for operations that don't need tenant filtering
   * Use with caution - only for super admin cross-tenant operations
   */
  get raw(): PrismaService {
    return this.prisma;
  }

  /**
   * Adds tenant filter to a where clause
   */
  private addTenantFilter<T extends Record<string, unknown>>(
    where: T | undefined,
    modelName: string,
  ): T & { tenantId?: string } {
    // Skip tenant models
    if (NON_TENANT_MODELS.includes(modelName as (typeof NON_TENANT_MODELS)[number])) {
      return (where || {}) as T & { tenantId?: string };
    }

    // Check if model is tenant-scoped
    if (!TENANT_SCOPED_MODELS.includes(modelName as TenantScopedModel)) {
      this.logger.warn(`Model ${modelName} not in tenant-scoped list, skipping filter`);
      return (where || {}) as T & { tenantId?: string };
    }

    // Check if we should bypass tenant filtering
    if (this.tenantContext.shouldBypassTenantFilter()) {
      this.logger.debug(`Bypassing tenant filter for ${modelName} (super admin mode)`);
      return (where || {}) as T & { tenantId?: string };
    }

    const tenantId = this.tenantContext.getTenantId();

    if (!tenantId) {
      this.logger.error(`No tenant ID available for ${modelName} query`);
      throw new Error('Tenant ID is required for this operation');
    }

    return {
      ...(where || {}),
      tenantId,
    } as T & { tenantId: string };
  }

  /**
   * Adds tenantId to create data
   */
  private addTenantToCreateData<T extends Record<string, unknown>>(
    data: T,
    modelName: string,
  ): T & { tenantId?: string } {
    // Skip tenant models
    if (NON_TENANT_MODELS.includes(modelName as (typeof NON_TENANT_MODELS)[number])) {
      return data as T & { tenantId?: string };
    }

    // Check if model is tenant-scoped
    if (!TENANT_SCOPED_MODELS.includes(modelName as TenantScopedModel)) {
      return data as T & { tenantId?: string };
    }

    // If tenantId is already provided, use it (for super admin creating for specific tenant)
    if ('tenantId' in data && data.tenantId) {
      return data as T & { tenantId: string };
    }

    const tenantId = this.tenantContext.getTenantId();

    if (!tenantId) {
      // Super admin must explicitly provide tenantId when creating
      if (this.tenantContext.isSuperAdmin()) {
        throw new Error('Super admin must provide tenantId when creating records');
      }
      throw new Error('Tenant ID is required for this operation');
    }

    return {
      ...data,
      tenantId,
    } as T & { tenantId: string };
  }

  // ============================================
  // USER OPERATIONS (Tenant-Scoped)
  // ============================================

  get user() {
    const context = this;
    return {
      findUnique: (args: Prisma.UserFindUniqueArgs) => {
        return context.prisma.user.findUnique({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'user') as Prisma.UserWhereUniqueInput,
        });
      },
      findFirst: (args: Prisma.UserFindFirstArgs) => {
        return context.prisma.user.findFirst({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'user'),
        });
      },
      findMany: (args?: Prisma.UserFindManyArgs) => {
        return context.prisma.user.findMany({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'user'),
        });
      },
      create: (args: Prisma.UserCreateArgs) => {
        return context.prisma.user.create({
          ...args,
          data: context.addTenantToCreateData(args.data as Record<string, unknown>, 'user') as Prisma.UserCreateInput,
        });
      },
      update: (args: Prisma.UserUpdateArgs) => {
        return context.prisma.user.update({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'user') as Prisma.UserWhereUniqueInput,
        });
      },
      delete: (args: Prisma.UserDeleteArgs) => {
        return context.prisma.user.delete({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'user') as Prisma.UserWhereUniqueInput,
        });
      },
      count: (args?: Prisma.UserCountArgs) => {
        return context.prisma.user.count({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'user'),
        });
      },
    };
  }

  // ============================================
  // FACILITY OPERATIONS (Tenant-Scoped)
  // ============================================

  get facility() {
    const context = this;
    return {
      findUnique: (args: Prisma.FacilityFindUniqueArgs) => {
        return context.prisma.facility.findUnique({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'facility') as Prisma.FacilityWhereUniqueInput,
        });
      },
      findFirst: (args: Prisma.FacilityFindFirstArgs) => {
        return context.prisma.facility.findFirst({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'facility'),
        });
      },
      findMany: (args?: Prisma.FacilityFindManyArgs) => {
        return context.prisma.facility.findMany({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'facility'),
        });
      },
      create: (args: Prisma.FacilityCreateArgs) => {
        return context.prisma.facility.create({
          ...args,
          data: context.addTenantToCreateData(args.data as Record<string, unknown>, 'facility') as Prisma.FacilityCreateInput,
        });
      },
      update: (args: Prisma.FacilityUpdateArgs) => {
        return context.prisma.facility.update({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'facility') as Prisma.FacilityWhereUniqueInput,
        });
      },
      delete: (args: Prisma.FacilityDeleteArgs) => {
        return context.prisma.facility.delete({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'facility') as Prisma.FacilityWhereUniqueInput,
        });
      },
      count: (args?: Prisma.FacilityCountArgs) => {
        return context.prisma.facility.count({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'facility'),
        });
      },
    };
  }

  // ============================================
  // COURT OPERATIONS (Tenant-Scoped)
  // ============================================

  get court() {
    const context = this;
    return {
      findUnique: (args: Prisma.CourtFindUniqueArgs) => {
        return context.prisma.court.findUnique({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'court') as Prisma.CourtWhereUniqueInput,
        });
      },
      findFirst: (args: Prisma.CourtFindFirstArgs) => {
        return context.prisma.court.findFirst({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'court'),
        });
      },
      findMany: (args?: Prisma.CourtFindManyArgs) => {
        return context.prisma.court.findMany({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'court'),
        });
      },
      create: (args: Prisma.CourtCreateArgs) => {
        return context.prisma.court.create({
          ...args,
          data: context.addTenantToCreateData(args.data as Record<string, unknown>, 'court') as Prisma.CourtCreateInput,
        });
      },
      update: (args: Prisma.CourtUpdateArgs) => {
        return context.prisma.court.update({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'court') as Prisma.CourtWhereUniqueInput,
        });
      },
      delete: (args: Prisma.CourtDeleteArgs) => {
        return context.prisma.court.delete({
          ...args,
          where: context.addTenantFilter(args.where as Record<string, unknown>, 'court') as Prisma.CourtWhereUniqueInput,
        });
      },
      count: (args?: Prisma.CourtCountArgs) => {
        return context.prisma.court.count({
          ...args,
          where: context.addTenantFilter(args?.where as Record<string, unknown>, 'court'),
        });
      },
    };
  }

  // ============================================
  // TENANT OPERATIONS (No tenant filtering)
  // ============================================

  get tenant() {
    // Tenant model doesn't have tenant filtering
    return this.prisma.tenant;
  }

  // ============================================
  // TRANSACTION SUPPORT
  // ============================================

  /**
   * Execute operations in a transaction
   * Note: Tenant filtering is still applied within the transaction
   */
  async $transaction<T>(
    fn: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
