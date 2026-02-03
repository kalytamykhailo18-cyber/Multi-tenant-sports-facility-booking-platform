// Root Application Module
// Configures all global modules and imports feature modules

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Configuration
import {
  appConfig,
  jwtConfig,
  databaseConfig,
  redisConfig,
  validate,
} from './config';

// Global modules
import { PrismaModule } from './prisma';
import { RedisModule } from './redis';

// Common components
import { AllExceptionsFilter } from './common/filters';
import {
  TransformInterceptor,
  TenantInterceptor,
  AuditInterceptor,
} from './common/interceptors';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { TenantModule } from './common/tenant';
import { AuditModule } from './common/audit';
import { WsModule } from './common/gateway';
import { EncryptionModule } from './common/encryption';

// Health check module
import { HealthModule } from './health';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CourtsModule } from './modules/courts/courts.module';
import { OperatingHoursModule } from './modules/operating-hours/operating-hours.module';
// import { BookingsModule } from './modules/bookings/bookings.module';
// import { CustomersModule } from './modules/customers/customers.module';
// import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, redisConfig],
      validate,
      envFilePath: ['.env', '../../.env'],
    }),

    // Database module (global)
    PrismaModule,

    // Redis module (global)
    RedisModule,

    // Audit logging module (global)
    AuditModule,

    // Tenant isolation module (global)
    TenantModule,

    // WebSocket module (global)
    WsModule,

    // Encryption module (global)
    EncryptionModule,

    // Health check module
    HealthModule,

    // Feature modules
    AuthModule,
    TenantsModule,
    FacilitiesModule,
    SubscriptionsModule,
    DashboardModule,
    CourtsModule,
    OperatingHoursModule,
    // BookingsModule,
    // CustomersModule,
    // PaymentsModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response transformer (runs last, wraps response)
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global tenant interceptor (sets tenant context after auth)
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    // Global audit interceptor (logs all significant requests)
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Global JWT auth guard - all routes require auth unless marked @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard - checks role requirements after auth
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
