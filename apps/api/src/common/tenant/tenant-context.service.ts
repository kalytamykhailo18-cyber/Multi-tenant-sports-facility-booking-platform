// Tenant Context Service
// Uses AsyncLocalStorage to maintain tenant context throughout a request lifecycle

import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string | null;
  userId: string;
  userRole: string;
  isSuperAdmin: boolean;
  // Flag to bypass tenant filtering (for super admin operations)
  bypassTenantFilter: boolean;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextData>();

  /**
   * Runs a callback within a tenant context
   * @param data The tenant context data
   * @param callback The function to run within the context
   */
  run<T>(data: TenantContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  /**
   * Gets the current tenant context
   * @returns The current tenant context or undefined if not in a request
   */
  getContext(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  /**
   * Gets the current tenant ID
   * @returns The tenant ID or null if not set or if super admin without tenant
   */
  getTenantId(): string | null {
    const context = this.getContext();
    return context?.tenantId ?? null;
  }

  /**
   * Gets the current user ID
   */
  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  /**
   * Gets the current user role
   */
  getUserRole(): string | undefined {
    return this.getContext()?.userRole;
  }

  /**
   * Checks if the current user is a super admin
   */
  isSuperAdmin(): boolean {
    return this.getContext()?.isSuperAdmin ?? false;
  }

  /**
   * Checks if tenant filtering should be bypassed
   * Only true for super admin operations that need cross-tenant access
   */
  shouldBypassTenantFilter(): boolean {
    const context = this.getContext();
    // Super admins without a specific tenant can bypass
    return context?.bypassTenantFilter ?? (context?.isSuperAdmin && !context?.tenantId) ?? false;
  }

  /**
   * Validates that a tenant ID is available for operations that require it
   * @throws Error if tenant ID is not available and not a super admin
   */
  requireTenantId(): string {
    const context = this.getContext();

    if (!context) {
      throw new Error('No tenant context available');
    }

    if (context.tenantId) {
      return context.tenantId;
    }

    if (context.isSuperAdmin) {
      throw new Error('Super admin must specify a tenant for this operation (use X-Tenant-Id header)');
    }

    throw new Error('User is not associated with a tenant');
  }
}
