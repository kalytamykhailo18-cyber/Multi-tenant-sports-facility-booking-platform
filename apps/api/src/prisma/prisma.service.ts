// Prisma Service
// Provides database connection using Prisma Client
// CRITICAL: Implements multi-tenant isolation via middleware

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

// Models that do NOT have tenantId field
const MODELS_WITHOUT_TENANT_ID = ['Tenant'];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private tenantContextService: any = null;

  constructor(private configService: ConfigService) {
    const isDevelopment =
      configService.get<string>('app.nodeEnv') === 'development';

    super({
      log: isDevelopment
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [{ level: 'error', emit: 'stdout' }],
    });

    // Log queries in development mode
    if (isDevelopment) {
      // @ts-expect-error - Prisma event typing
      this.$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // CRITICAL: Setup multi-tenant middleware
    this.setupTenantMiddleware();
  }

  /**
   * Set tenant context service (injected after module initialization)
   * This is called by TenantModule to avoid circular dependency
   */
  setTenantContextService(service: any) {
    this.tenantContextService = service;
    this.logger.log('Tenant context service connected to Prisma');
  }

  /**
   * CRITICAL: Multi-tenant middleware
   * Automatically filters all queries by tenantId
   * Prevents data leakage across tenants
   */
  private setupTenantMiddleware() {
    this.$use(async (params, next) => {
      const modelName = params.model;

      // Skip models without tenantId
      if (!modelName || MODELS_WITHOUT_TENANT_ID.includes(modelName)) {
        return next(params);
      }

      // Get tenant context (if available - it's injected after module init)
      const contextService = this.tenantContextService;

      // If no context service yet (during app initialization), allow query
      if (!contextService) {
        return next(params);
      }

      const context = contextService.getContext?.();

      // If bypass flag is set (super admin without tenant), skip filtering
      const shouldBypass = context?.bypassTenantFilter || false;
      if (shouldBypass) {
        this.logger.debug(`[Tenant Middleware] Bypassing tenant filter for ${modelName}`);
        return next(params);
      }

      // Get tenantId from context
      const tenantId = context?.tenantId;

      // CRITICAL: If no tenantId and not bypassing, log warning
      // This indicates a security issue - queries without tenant context
      if (!tenantId && !shouldBypass) {
        this.logger.warn(
          `[Tenant Middleware] Query on ${modelName} without tenantId context! This is a security risk.`,
        );
      }

      // Apply tenant filter based on operation type
      switch (params.action) {
        case 'findUnique':
        case 'findFirst':
        case 'findMany':
        case 'count':
        case 'aggregate':
        case 'groupBy':
          // Add tenantId to where clause
          if (tenantId) {
            params.args = params.args || {};
            params.args.where = params.args.where || {};

            // Merge with existing where clause
            if (typeof params.args.where === 'object' && !Array.isArray(params.args.where)) {
              params.args.where = {
                ...params.args.where,
                tenantId,
              };
            }

            this.logger.debug(`[Tenant Middleware] Added tenantId filter to ${params.action} on ${modelName}`);
          }
          break;

        case 'create':
        case 'createMany':
          // Add tenantId to data
          if (tenantId) {
            params.args = params.args || {};

            if (params.action === 'create') {
              params.args.data = params.args.data || {};
              params.args.data.tenantId = tenantId;
            } else if (params.action === 'createMany') {
              params.args.data = params.args.data || [];
              if (Array.isArray(params.args.data)) {
                params.args.data = params.args.data.map((item: unknown) => ({
                  ...(typeof item === 'object' && item !== null ? item : {}),
                  tenantId,
                }));
              }
            }

            this.logger.debug(`[Tenant Middleware] Added tenantId to ${params.action} on ${modelName}`);
          }
          break;

        case 'update':
        case 'updateMany':
        case 'delete':
        case 'deleteMany':
        case 'upsert':
          // Add tenantId to where clause
          if (tenantId) {
            params.args = params.args || {};
            params.args.where = params.args.where || {};

            if (typeof params.args.where === 'object' && !Array.isArray(params.args.where)) {
              params.args.where = {
                ...params.args.where,
                tenantId,
              };
            }

            this.logger.debug(`[Tenant Middleware] Added tenantId filter to ${params.action} on ${modelName}`);
          }
          break;
      }

      return next(params);
    });

    this.logger.log('Multi-tenant middleware initialized');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Clean the database (for testing purposes only)
   * WARNING: This deletes all data!
   */
  async cleanDatabase() {
    if (this.configService.get<string>('app.nodeEnv') === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as { deleteMany: () => Promise<unknown> }).deleteMany();
        }
        return Promise.resolve();
      }),
    );
  }
}
