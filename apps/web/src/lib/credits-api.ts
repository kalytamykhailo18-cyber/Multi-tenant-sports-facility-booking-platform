// Credits API Functions
// Frontend API client for customer credit management

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export type CreditReason =
  | 'EARLY_CANCELLATION'
  | 'REFUND'
  | 'MANUAL'
  | 'PAYMENT_ERROR'
  | 'PROMOTIONAL';

export interface Credit {
  id: string;
  tenantId: string;
  customerId: string;
  originalAmount: number;
  remainingAmount: number;
  usedAmount: number;
  currency: string;
  reason: CreditReason;
  sourceBookingId?: string | null;
  sourcePaymentId?: string | null;
  description?: string | null;
  usedInBookingIds: string[];
  expiresAt?: string | null;
  isExpired: boolean;
  isActive: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditListResponse {
  items: Credit[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerCreditBalance {
  customerId: string;
  totalBalance: number;
  currency: string;
  activeCreditsCount: number;
  credits: Credit[];
}

export interface ApplyCreditResult {
  success: boolean;
  amountApplied: number;
  remainingToPay: number;
  creditsUsed: string[];
  message?: string;
}

export interface CreateCreditRequest {
  customerId: string;
  amount: number;
  currency?: string;
  reason: CreditReason;
  sourceBookingId?: string;
  sourcePaymentId?: string;
  description?: string;
  expiresAt?: string;
}

export interface UseCreditRequest {
  customerId: string;
  bookingId: string;
  amount: number;
  creditIds?: string[];
}

export interface QueryCreditParams {
  customerId?: string;
  reason?: CreditReason;
  sourceBookingId?: string;
  isActive?: boolean;
  hasBalance?: boolean;
  includeExpired?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'remainingAmount' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Credits API Functions
// ============================================

export const creditsApi = {
  /**
   * Create a new credit for a customer
   */
  async create(data: CreateCreditRequest): Promise<Credit> {
    return apiClient.post<Credit>('/credits', data);
  },

  /**
   * Get paginated list of credits
   */
  async list(params?: QueryCreditParams): Promise<CreditListResponse> {
    return apiClient.get<CreditListResponse>('/credits', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get credit by ID
   */
  async getById(id: string): Promise<Credit> {
    return apiClient.get<Credit>(`/credits/${id}`);
  },

  /**
   * Get customer's credit balance
   */
  async getCustomerBalance(customerId: string): Promise<CustomerCreditBalance> {
    return apiClient.get<CustomerCreditBalance>(`/credits/customer/${customerId}/balance`);
  },

  /**
   * Apply credits to a booking
   */
  async useCredits(data: UseCreditRequest): Promise<ApplyCreditResult> {
    return apiClient.post<ApplyCreditResult>('/credits/use', data);
  },

  /**
   * Deactivate a credit
   */
  async deactivate(id: string, reason?: string): Promise<Credit> {
    return apiClient.post<Credit>(`/credits/${id}/deactivate`, { reason });
  },

  /**
   * Get credits created from a specific booking
   */
  async getByBooking(bookingId: string): Promise<Credit[]> {
    return apiClient.get<Credit[]>(`/credits/booking/${bookingId}`);
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get display label for credit reason
 */
export function getCreditReasonLabel(reason: CreditReason): string {
  const labels: Record<CreditReason, string> = {
    EARLY_CANCELLATION: 'Cancelación anticipada',
    REFUND: 'Reembolso',
    MANUAL: 'Crédito manual',
    PAYMENT_ERROR: 'Error de pago',
    PROMOTIONAL: 'Promocional',
  };
  return labels[reason] || reason;
}

/**
 * Get color for credit reason
 */
export function getCreditReasonColor(reason: CreditReason): string {
  const colors: Record<CreditReason, string> = {
    EARLY_CANCELLATION: 'bg-blue-100 text-blue-700',
    REFUND: 'bg-orange-100 text-orange-700',
    MANUAL: 'bg-purple-100 text-purple-700',
    PAYMENT_ERROR: 'bg-red-100 text-red-700',
    PROMOTIONAL: 'bg-green-100 text-green-700',
  };
  return colors[reason] || 'bg-gray-100 text-gray-700';
}

/**
 * Format credit amount for display
 */
export function formatCreditAmount(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Check if credit has usable balance
 */
export function hasCreditBalance(credit: Credit): boolean {
  return credit.isActive && !credit.isExpired && credit.remainingAmount > 0;
}

/**
 * Calculate percentage of credit used
 */
export function getCreditUsedPercentage(credit: Credit): number {
  if (credit.originalAmount === 0) return 0;
  return Math.round((credit.usedAmount / credit.originalAmount) * 100);
}

/**
 * Check if credit is expired
 */
export function isCreditExpired(credit: Credit): boolean {
  if (credit.isExpired) return true;
  if (!credit.expiresAt) return false;
  return new Date(credit.expiresAt) < new Date();
}

/**
 * Get days until credit expires
 */
export function getDaysUntilExpiration(credit: Credit): number | null {
  if (!credit.expiresAt) return null;
  const expiresAt = new Date(credit.expiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
