// Root Application Module
// Configures all global modules and imports feature modules

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Configuration
import { appConfig, jwtConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { mercadopagoConfig } from './config/mercadopago.config';
import { validate } from './config/env.validation';

// Global modules
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

// Common components
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantModule } from './common/tenant/tenant.module';
import { AuditModule } from './common/audit/audit.module';
import { WsModule } from './common/gateway/ws.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { QueueModule } from './common/queue/queue.module';

// Health check module
import { HealthModule } from './health/health.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CourtsModule } from './modules/courts/courts.module';
import { OperatingHoursModule } from './modules/operating-hours/operating-hours.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CreditsModule } from './modules/credits/credits.module';
import { TakeoverModule } from './modules/takeover/takeover.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OpponentMatchModule } from './modules/opponent-match/opponent-match.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, redisConfig, mercadopagoConfig],
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

    // Queue module (global) - BullMQ for background jobs
    QueueModule,

    // Schedule module (global) - Cron jobs
    ScheduleModule.forRoot(),

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
    BookingsModule,
    CustomersModule,
    PaymentsModule,
    CreditsModule,
    TakeoverModule,
    SuperAdminModule,
    NotificationsModule,
    ReportsModule,
    OpponentMatchModule,
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
