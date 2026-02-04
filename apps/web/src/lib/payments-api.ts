// Payments API Functions
// Frontend API client for payment management with Mercado Pago integration

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentType =
  | 'BOOKING_DEPOSIT'
  | 'BOOKING_BALANCE'
  | 'SUBSCRIPTION';

export interface Payment {
  id: string;
  tenantId: string;
  bookingId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  type: PaymentType;
  amount: number;
  currency: string;
  externalPreferenceId?: string | null;
  externalPaymentId?: string | null;
  externalStatus?: string | null;
  status: PaymentStatus;
  payerEmail?: string | null;
  paymentMethod?: string | null;
  webhookReceivedAt?: string | null;
  processedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface PreferenceResponse {
  id: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

export interface PaymentStatusResponse {
  id: string;
  status: PaymentStatus;
  externalStatus?: string | null;
  isCompleted: boolean;
  isPending: boolean;
  isFailed: boolean;
  errorMessage?: string | null;
  completedAt?: string | null;
}

export interface CreatePreferenceRequest {
  bookingId: string;
  type: PaymentType;
  payerEmail?: string;
  payerName?: string;
  amount?: number;
  successUrl?: string;
  failureUrl?: string;
}

export interface QueryPaymentParams {
  bookingId?: string;
  subscriptionId?: string;
  customerId?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  statuses?: PaymentStatus[];
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ReconciliationResult {
  checked: number;
  updated: number;
  completed: number;
  failed: number;
  errors: number;
  stale: number;
}

export interface SingleReconciliationResult {
  updated: boolean;
  newStatus?: PaymentStatus;
  message: string;
}

export interface WebhookQueueStats {
  queue: string;
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

// ============================================
// Payments API Functions
// ============================================

export const paymentsApi = {
  /**
   * Create a Mercado Pago payment preference for a booking
   * Returns a checkout URL for the customer
   */
  async createPreference(data: CreatePreferenceRequest): Promise<PreferenceResponse> {
    return apiClient.post<PreferenceResponse>('/payments/preference', data);
  },

  /**
   * Get paginated list of payments
   */
  async list(params?: QueryPaymentParams): Promise<PaymentListResponse> {
    if (!params) {
      return apiClient.get<PaymentListResponse>('/payments');
    }
    // Convert params to simple types (no arrays)
    const { statuses, ...rest } = params;
    const queryParams: Record<string, string | number | boolean | undefined> = { ...rest };
    // Handle statuses array by joining into comma-separated string
    if (statuses && statuses.length > 0) {
      queryParams.statuses = statuses.join(',');
    }
    return apiClient.get<PaymentListResponse>('/payments', { params: queryParams });
  },

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${id}`);
  },

  /**
   * Get payment status
   */
  async getStatus(id: string): Promise<PaymentStatusResponse> {
    return apiClient.get<PaymentStatusResponse>(`/payments/${id}/status`);
  },

  /**
   * Refresh payment status from Mercado Pago
   */
  async refreshStatus(id: string): Promise<PaymentStatusResponse> {
    return apiClient.post<PaymentStatusResponse>(`/payments/${id}/refresh`);
  },

  /**
   * Get all payments for a booking
   */
  async getByBooking(bookingId: string): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`/payments/booking/${bookingId}`);
  },

  /**
   * Trigger manual reconciliation of all pending payments
   * Only available to Super Admin and Owners
   */
  async triggerReconciliation(): Promise<ReconciliationResult> {
    return apiClient.post<ReconciliationResult>('/payments/reconcile');
  },

  /**
   * Reconcile a specific payment by ID
   * Only available to Super Admin and Owners
   */
  async reconcilePayment(id: string): Promise<SingleReconciliationResult> {
    return apiClient.post<SingleReconciliationResult>(`/payments/${id}/reconcile`);
  },

  /**
   * Get webhook queue statistics for monitoring
   */
  async getWebhookQueueStats(): Promise<WebhookQueueStats> {
    return apiClient.get<WebhookQueueStats>('/webhooks/mercadopago/stats');
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get display label for payment status
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    PENDING: 'Pendiente',
    PROCESSING: 'Procesando',
    COMPLETED: 'Completado',
    FAILED: 'Fallido',
    REFUNDED: 'Reembolsado',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}

/**
 * Get display label for payment type
 */
export function getPaymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    BOOKING_DEPOSIT: 'Seña de reserva',
    BOOKING_BALANCE: 'Saldo de reserva',
    SUBSCRIPTION: 'Suscripción',
  };
  return labels[type] || type;
}

/**
 * Get color variant for payment status
 */
export function getPaymentStatusVariant(
  status: PaymentStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
    PENDING: 'warning',
    PROCESSING: 'secondary',
    COMPLETED: 'success',
    FAILED: 'destructive',
    REFUNDED: 'outline',
    CANCELLED: 'destructive',
  };
  return variants[status] || 'outline';
}

/**
 * Get background color class for payment status
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-50 text-red-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Open Mercado Pago checkout in a new tab
 */
export function openMercadoPagoCheckout(
  preference: PreferenceResponse,
  useSandbox = false,
): void {
  const url = useSandbox ? preference.sandboxInitPoint : preference.initPoint;
  if (url) {
    window.open(url, '_blank');
  }
}

/**
 * Check if payment is in a final state
 */
export function isPaymentFinal(status: PaymentStatus): boolean {
  return ['COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'].includes(status);
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
}
