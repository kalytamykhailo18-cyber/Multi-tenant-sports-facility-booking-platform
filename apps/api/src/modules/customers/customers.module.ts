// Customers Module
// Customer management module with all dependencies

import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { AuditModule } from '../../common/audit/audit.module';
import { WsModule } from '../../common/gateway/ws.module';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    AuditModule,
    WsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
