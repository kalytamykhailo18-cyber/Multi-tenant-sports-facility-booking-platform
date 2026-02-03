// Courts API Functions
// Frontend API client for court management

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export type CourtStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type SportType = 'SOCCER' | 'PADEL' | 'TENNIS' | 'MULTI';

export interface Court {
  id: string;
  tenantId: string;
  facilityId: string;
  name: string;
  sportType: SportType;
  description: string | null;
  surfaceType: string | null;
  isIndoor: boolean;
  basePricePerHour: number;
  status: CourtStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  facilityName?: string;
  currencyCode?: string;
  todayBookingsCount?: number;
  nextAvailableSlot?: string;
}

export interface CourtListResponse {
  items: Court[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCourtRequest {
  facilityId: string;
  name: string;
  sportType?: SportType;
  description?: string;
  surfaceType?: string;
  isIndoor?: boolean;
  basePricePerHour: number;
  status?: CourtStatus;
  displayOrder?: number;
}

export interface UpdateCourtRequest {
  name?: string;
  sportType?: SportType;
  description?: string;
  surfaceType?: string;
  isIndoor?: boolean;
  basePricePerHour?: number;
  status?: CourtStatus;
  displayOrder?: number;
}

export interface UpdateCourtStatusRequest {
  status: CourtStatus;
}

export interface ReorderCourtsRequest {
  facilityId: string;
  courtIds: string[];
}

export interface QueryCourtParams {
  page?: number;
  limit?: number;
  facilityId?: string;
  status?: CourtStatus;
  sportType?: SportType;
  isIndoor?: boolean;
  search?: string;
  sortBy?: 'name' | 'basePricePerHour' | 'createdAt' | 'displayOrder' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// API Functions
// ============================================

export const courtsApi = {
  /**
   * Get paginated list of courts
   */
  async list(params?: QueryCourtParams): Promise<CourtListResponse> {
    return apiClient.get<CourtListResponse>('/courts', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get courts by facility ID
   */
  async getByFacility(facilityId: string): Promise<Court[]> {
    return apiClient.get<Court[]>(`/courts/facility/${facilityId}`);
  },

  /**
   * Get court by ID
   */
  async getById(id: string): Promise<Court> {
    return apiClient.get<Court>(`/courts/${id}`);
  },

  /**
   * Create a new court
   */
  async create(data: CreateCourtRequest): Promise<Court> {
    return apiClient.post<Court>('/courts', data);
  },

  /**
   * Update a court
   */
  async update(id: string, data: UpdateCourtRequest): Promise<Court> {
    return apiClient.patch<Court>(`/courts/${id}`, data);
  },

  /**
   * Update court status
   */
  async updateStatus(id: string, status: CourtStatus): Promise<Court> {
    return apiClient.patch<Court>(`/courts/${id}/status`, { status });
  },

  /**
   * Reorder courts within a facility
   */
  async reorder(data: ReorderCourtsRequest): Promise<Court[]> {
    return apiClient.patch<Court[]>('/courts/reorder', data);
  },

  /**
   * Delete a court (soft delete)
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/courts/${id}`);
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get display label for sport type
 */
export function getSportTypeLabel(sportType: SportType): string {
  const labels: Record<SportType, string> = {
    SOCCER: 'Fútbol',
    PADEL: 'Pádel',
    TENNIS: 'Tenis',
    MULTI: 'Multiuso',
  };
  return labels[sportType] || sportType;
}

/**
 * Get icon emoji for sport type
 */
export function getSportTypeIcon(sportType: SportType): string {
  const icons: Record<SportType, string> = {
    SOCCER: '⚽',
    PADEL: '🎾',
    TENNIS: '🎾',
    MULTI: '🏟️',
  };
  return icons[sportType] || '🏟️';
}

/**
 * Get display label for court status
 */
export function getCourtStatusLabel(status: CourtStatus): string {
  const labels: Record<CourtStatus, string> = {
    ACTIVE: 'Activa',
    MAINTENANCE: 'Mantenimiento',
    INACTIVE: 'Inactiva',
  };
  return labels[status] || status;
}

/**
 * Get variant for court status badge
 */
export function getCourtStatusVariant(
  status: CourtStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<CourtStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    MAINTENANCE: 'secondary',
    INACTIVE: 'destructive',
  };
  return variants[status] || 'outline';
}
