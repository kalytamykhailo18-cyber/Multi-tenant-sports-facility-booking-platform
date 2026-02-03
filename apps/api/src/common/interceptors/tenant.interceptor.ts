// Tenant Interceptor
// Sets tenant context after authentication guard, before request handler

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService, TenantContextData } from '../tenant/tenant-context.service';
import { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;

    // If no user (public route), continue without tenant context
    if (!user) {
      return next.handle();
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    // For super admin, check for X-Tenant-Id header to optionally scope to a tenant
    let tenantId = user.tenantId;
    let bypassTenantFilter = false;

    if (isSuperAdmin) {
      const headerTenantId = request.headers['x-tenant-id'];
      if (headerTenantId && typeof headerTenantId === 'string') {
        tenantId = headerTenantId;
        this.logger.debug(`Super admin scoped to tenant: ${tenantId}`);
      } else {
        // Super admin without tenant header can bypass tenant filtering
        bypassTenantFilter = true;
        this.logger.debug('Super admin operating in cross-tenant mode');
      }
    }

    const contextData: TenantContextData = {
      tenantId,
      userId: user.id,
      userRole: user.role,
      isSuperAdmin,
      bypassTenantFilter,
    };

    // Attach tenant context to request for use in decorators
    request.tenantContext = contextData;

    // Run the handler within the tenant context
    return new Observable((subscriber) => {
      this.tenantContext.run(contextData, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
