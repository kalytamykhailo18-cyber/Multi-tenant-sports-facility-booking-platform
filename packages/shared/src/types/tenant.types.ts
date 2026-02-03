// Tenant related types
// Types for tenant and facility management

import type { TenantStatus, FacilityStatus } from '@sports-booking/database';
import type { SubscriptionStatus } from '../constants';

// Tenant list item for Super Admin view
export interface TenantListItem {
  id: string;
  businessName: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  facilitiesCount: number;
  activeSubscription: boolean;
  subscriptionStatus?: SubscriptionStatus;
}

// Tenant details for Super Admin view
export interface TenantDetails {
  id: string;
  businessName: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  facilities: TenantFacilitySummary[];
  usersCount: number;
  ownerEmail?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionDueDate?: string;
}

// Facility summary within tenant context
export interface TenantFacilitySummary {
  id: string;
  name: string;
  city: string;
  status: FacilityStatus;
  courtsCount: number;
  hasWhatsapp: boolean;
  hasMercadopago: boolean;
}

// Create tenant input
export interface CreateTenantInput {
  businessName: string;
  slug?: string;
}

// Update tenant input
export interface UpdateTenantInput {
  businessName?: string;
  slug?: string;
  status?: TenantStatus;
}

// Tenant filter options
export interface TenantFilters {
  status?: TenantStatus;
  search?: string;
  hasActiveSubscription?: boolean;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
