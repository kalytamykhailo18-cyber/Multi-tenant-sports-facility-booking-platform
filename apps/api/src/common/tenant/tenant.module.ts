// Tenant Module
// Provides tenant isolation services for multi-tenant architecture

import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantAwarePrismaService } from './tenant-aware-prisma.service';

@Global()
@Module({
  providers: [TenantContextService, TenantAwarePrismaService],
  exports: [TenantContextService, TenantAwarePrismaService],
})
export class TenantModule {}
