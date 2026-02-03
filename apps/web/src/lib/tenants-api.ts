// Tenants API Functions
// API client functions for tenant management

import { apiClient } from './api';

// Types
export interface Tenant {
  id: string;
  businessName: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  facilityCount?: number;
  userCount?: number;
  hasActiveSubscription?: boolean;
}

export interface TenantListResponse {
  items: Tenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTenantRequest {
  businessName: string;
  slug?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
}

export interface UpdateTenantRequest {
  businessName?: string;
  slug?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
}

export interface QueryTenantParams {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  search?: string;
  sortBy?: 'createdAt' | 'businessName' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// API functions
export const tenantsApi = {
  /**
   * Get paginated list of tenants
   */
  async list(params?: QueryTenantParams): Promise<TenantListResponse> {
    return apiClient.get<TenantListResponse>('/tenants', {
      params: params as Record<string, string | number | boolean | undefined>
    });
  },

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`);
  },

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/slug/${slug}`);
  },

  /**
   * Create a new tenant
   */
  async create(data: CreateTenantRequest): Promise<Tenant> {
    return apiClient.post<Tenant>('/tenants', data);
  },

  /**
   * Update a tenant
   */
  async update(id: string, data: UpdateTenantRequest): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/tenants/${id}`, data);
  },

  /**
   * Delete a tenant
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/tenants/${id}`);
  },

  /**
   * Suspend a tenant
   */
  async suspend(id: string, reason?: string): Promise<Tenant> {
    return apiClient.post<Tenant>(`/tenants/${id}/suspend`, { reason });
  },

  /**
   * Reactivate a suspended tenant
   */
  async reactivate(id: string): Promise<Tenant> {
    return apiClient.post<Tenant>(`/tenants/${id}/reactivate`);
  },

  /**
   * Get users for a tenant
   */
  async getUsers(tenantId: string): Promise<{
    tenantId: string;
    count: number;
    users: Array<{
      id: string;
      email: string;
      fullName: string;
      role: string;
      isActive: boolean;
      createdAt: string;
    }>;
  }> {
    return apiClient.get(`/tenants/${tenantId}/users`);
  },

  /**
   * Get facilities for a tenant
   */
  async getFacilities(tenantId: string): Promise<{
    tenantId: string;
    count: number;
    facilities: Array<{
      id: string;
      name: string;
      city: string;
      status: string;
      createdAt: string;
    }>;
  }> {
    return apiClient.get(`/tenants/${tenantId}/facilities`);
  },
};
