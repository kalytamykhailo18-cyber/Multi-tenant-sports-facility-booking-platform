// Subscriptions API Functions
// API client functions for subscription management

import { apiClient } from './api';

// Types
export type SubscriptionStatus = 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'SUSPENDED' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface Subscription {
  id: string;
  tenantId: string;
  planName: string;
  priceAmount: number;
  currency: string;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: SubscriptionStatus;
  nextPaymentDate: string;
  lastPaymentDate?: string | null;
  lastPaymentAmount?: number | null;
  dueSoonDays: number;
  daysUntilDue: number;
  createdAt: string;
  updatedAt: string;
  tenantName?: string;
}

export interface SubscriptionListResponse {
  items: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSubscriptionRequest {
  tenantId: string;
  planName?: string;
  priceAmount: number;
  currency?: string;
  billingCycle?: BillingCycle;
  dueSoonDays?: number;
  startDate?: string;
}

export interface UpdateSubscriptionRequest {
  planName?: string;
  priceAmount?: number;
  currency?: string;
  billingCycle?: BillingCycle;
  status?: SubscriptionStatus;
  dueSoonDays?: number;
}

export interface QuerySubscriptionParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  tenantId?: string;
  sortBy?: 'createdAt' | 'nextPaymentDate' | 'status' | 'priceAmount';
  sortOrder?: 'asc' | 'desc';
}

// API functions
export const subscriptionsApi = {
  /**
   * Get paginated list of subscriptions
   */
  async list(params?: QuerySubscriptionParams): Promise<SubscriptionListResponse> {
    return apiClient.get<SubscriptionListResponse>('/subscriptions', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Get subscription by ID
   */
  async getById(id: string): Promise<Subscription> {
    return apiClient.get<Subscription>(`/subscriptions/${id}`);
  },

  /**
   * Get subscription by tenant ID
   */
  async getByTenantId(tenantId: string): Promise<Subscription | null> {
    return apiClient.get<Subscription | null>(`/subscriptions/tenant/${tenantId}`);
  },

  /**
   * Create a new subscription
   */
  async create(data: CreateSubscriptionRequest): Promise<Subscription> {
    return apiClient.post<Subscription>('/subscriptions', data);
  },

  /**
   * Update a subscription
   */
  async update(id: string, data: UpdateSubscriptionRequest): Promise<Subscription> {
    return apiClient.patch<Subscription>(`/subscriptions/${id}`, data);
  },

  /**
   * Suspend a subscription
   */
  async suspend(id: string, reason?: string): Promise<Subscription> {
    return apiClient.post<Subscription>(`/subscriptions/${id}/suspend`, { reason });
  },

  /**
   * Reactivate a suspended subscription
   */
  async reactivate(id: string): Promise<Subscription> {
    return apiClient.post<Subscription>(`/subscriptions/${id}/reactivate`);
  },

  /**
   * Cancel a subscription
   */
  async cancel(id: string, reason?: string): Promise<Subscription> {
    return apiClient.post<Subscription>(`/subscriptions/${id}/cancel`, { reason });
  },

  /**
   * Trigger status check (admin utility)
   */
  async checkStatuses(): Promise<{ updated: number; suspended: number }> {
    return apiClient.post<{ updated: number; suspended: number }>('/subscriptions/check-statuses');
  },
};
