// Tenant Module
// Provides tenant isolation services for multi-tenant architecture

import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantAwarePrismaService } from './tenant-aware-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

@Global()
@Module({
  providers: [TenantContextService, TenantAwarePrismaService],
  exports: [TenantContextService, TenantAwarePrismaService],
})
export class TenantModule implements OnModuleInit {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Connect TenantContextService to PrismaService middleware
   * This enables automatic tenant filtering in Prisma queries
   */
  onModuleInit() {
    this.prismaService.setTenantContextService(this.tenantContextService);
  }
}
