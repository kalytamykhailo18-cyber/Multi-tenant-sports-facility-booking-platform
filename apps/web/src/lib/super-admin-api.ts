// Super Admin API Functions
// Frontend API client for Super Admin endpoints

import { apiClient } from './api';

// ============================================
// Types (matching backend DTOs)
// ============================================

export interface FacilityWithUpcomingDue {
  facilityId: string;
  facilityName: string;
  dueDate: string;
  daysUntilDue: number;
  monthlyPrice: number;
}

export interface SuperAdminDashboard {
  totalFacilities: number;
  activeSubscriptions: number;
  suspendedSubscriptions: number;
  dueSoonSubscriptions: number;
  monthlyRevenue: number;
  facilitiesWithUpcomingDue: FacilityWithUpcomingDue[];
  newFacilitiesThisMonth: number;
  generatedAt: string;
}

export type FacilityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type SubscriptionStatus = 'ACTIVE' | 'DUE_SOON' | 'SUSPENDED';

export interface FacilitySummary {
  id: string;
  name: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  courtCount: number;
  subscriptionStatus: SubscriptionStatus;
  nextDueDate: string | null;
  monthlyPrice: number;
  whatsappConnected: boolean;
  mercadoPagoConnected: boolean;
  createdAt: string;
  status: FacilityStatus;
}

export interface FacilityListResponse {
  items: FacilitySummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FacilityQueryParams {
  search?: string;
  subscriptionStatus?: SubscriptionStatus;
  status?: FacilityStatus;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'nextDueDate';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// API Functions
// ============================================

export const superAdminApi = {
  /**
   * Get dashboard statistics for Super Admin
   */
  async getDashboard(): Promise<SuperAdminDashboard> {
    return apiClient.get<SuperAdminDashboard>('/super-admin/dashboard');
  },

  /**
   * Get all facilities with pagination and filters
   */
  async getFacilities(params?: FacilityQueryParams): Promise<FacilityListResponse> {
    return apiClient.get<FacilityListResponse>('/super-admin/facilities', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get facility details by ID
   */
  async getFacilityDetails(id: string): Promise<FacilitySummary> {
    return apiClient.get<FacilitySummary>(`/super-admin/facilities/${id}`);
  },
};
