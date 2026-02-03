// Dashboard API Functions
// Frontend API client for dashboard endpoints

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export interface TodayStats {
  bookingsCount: number;
  confirmedCount: number;
  pendingConfirmationCount: number;
  expectedRevenue: number;
  currency: string;
}

export interface WeekStats {
  bookingsCount: number;
  revenue: number;
  currency: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'SUSPENDED' | 'CANCELLED';

export interface SubscriptionStats {
  status: SubscriptionStatus;
  daysUntilDue: number;
  nextPaymentDate: string;
  planName: string;
}

export interface DashboardStats {
  today: TodayStats;
  week: WeekStats;
  cancellationRate: number;
  pendingEscalations: number;
  subscription: SubscriptionStats | null;
  courtCount: number;
  activeCustomers: number;
}

export type AlertType =
  | 'UNCONFIRMED_BOOKING'
  | 'PENDING_ESCALATION'
  | 'PAYMENT_ISSUE'
  | 'SUBSCRIPTION_REMINDER'
  | 'NO_SHOW_RISK';

export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DashboardAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  entityId: string;
  entityType: string;
  createdAt: string;
  actionLink: string | null;
}

export interface DashboardAlertsResponse {
  alerts: DashboardAlert[];
  total: number;
}

export interface UpcomingBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  courtName: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  depositPaid: boolean;
  isConfirmed: boolean;
  totalPrice: number;
  currency: string;
}

export interface DashboardUpcomingResponse {
  bookings: UpcomingBooking[];
  total: number;
}

export interface DashboardQueryParams {
  facilityId?: string;
}

export interface UpcomingQueryParams extends DashboardQueryParams {
  limit?: number;
}

// ============================================
// API Functions
// ============================================

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  async getStats(params?: DashboardQueryParams): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get dashboard alerts
   */
  async getAlerts(params?: DashboardQueryParams): Promise<DashboardAlertsResponse> {
    return apiClient.get<DashboardAlertsResponse>('/dashboard/alerts', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get upcoming bookings
   */
  async getUpcoming(params?: UpcomingQueryParams): Promise<DashboardUpcomingResponse> {
    return apiClient.get<DashboardUpcomingResponse>('/dashboard/upcoming', {
      params: params ? { ...params } : undefined,
    });
  },
};
