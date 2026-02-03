// Tenant Decorator
// Extracts the tenant ID from the current user/tenant context

import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantContextData } from '../tenant/tenant-context.service';

interface TenantIdOptions {
  required?: boolean;
}

/**
 * Extracts the tenant ID from the current authenticated user
 * For SUPER_ADMIN, optionally allows specifying tenant via header
 *
 * @example
 * @Get('bookings')
 * getBookings(@TenantId() tenantId: string) {
 *   return this.service.getBookings(tenantId);
 * }
 *
 * @example
 * @Get('all-data')
 * getAllData(@TenantId({ required: false }) tenantId: string | null) {
 *   // For super admin, tenantId may be null
 *   return this.service.getData(tenantId);
 * }
 */
export const TenantId = createParamDecorator(
  (data: TenantIdOptions | undefined, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();

    // First, try to get from tenant context (set by TenantInterceptor)
    const tenantContext: TenantContextData | undefined = request.tenantContext;

    if (tenantContext) {
      if (tenantContext.tenantId) {
        return tenantContext.tenantId;
      }

      // Super admin without specific tenant
      if (tenantContext.isSuperAdmin) {
        if (data?.required !== false) {
          throw new ForbiddenException(
            'Super admin must specify tenant for this operation (use X-Tenant-Id header)',
          );
        }
        return null;
      }

      // Non-admin without tenant
      if (data?.required !== false) {
        throw new ForbiddenException('User is not associated with a tenant');
      }
      return null;
    }

    // Fallback: try to get from user (for cases where interceptor hasn't run)
    const user = request.user;

    if (!user) {
      if (data?.required !== false) {
        throw new ForbiddenException('Authentication required');
      }
      return null;
    }

    // For SUPER_ADMIN, check for X-Tenant-Id header
    if (user.role === 'SUPER_ADMIN') {
      const headerTenantId = request.headers['x-tenant-id'];
      if (headerTenantId && typeof headerTenantId === 'string') {
        return headerTenantId;
      }
      if (data?.required !== false) {
        throw new ForbiddenException(
          'Super admin must specify tenant for this operation (use X-Tenant-Id header)',
        );
      }
      return null;
    }

    // For OWNER and STAFF, use tenant from JWT
    if (!user.tenantId && data?.required !== false) {
      throw new ForbiddenException('User is not associated with a tenant');
    }

    return user.tenantId;
  },
);

/**
 * Extracts the full tenant context from the request
 *
 * @example
 * @Get('data')
 * getData(@TenantContext() context: TenantContextData) {
 *   if (context.isSuperAdmin && context.bypassTenantFilter) {
 *     // Handle super admin cross-tenant access
 *   }
 * }
 */
export const TenantContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContextData | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext || null;
  },
);
