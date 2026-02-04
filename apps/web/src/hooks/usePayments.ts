// Payments Hooks
// Custom hooks for payment management with Mercado Pago integration

'use client';

import { useCallback, useEffect } from 'react';
import { usePaymentsStore } from '@/stores/payments.store';
import type {
  QueryPaymentParams,
  CreatePreferenceRequest,
  Payment,
  PaymentStatus,
  PaymentType,
} from '@/lib/payments-api';

/**
 * Main hook for payment management
 * Provides all payment-related state and actions
 */
export function usePayments() {
  const {
    payments,
    selectedPayment,
    currentPreference,
    pagination,
    filters,
    loading,
    loadingPayment,
    creatingPreference,
    refreshingStatus,
    error,
    loadPayments,
    loadPayment,
    createPreference,
    getPaymentStatus,
    refreshPaymentStatus,
    loadBookingPayments,
    setFilters,
    resetFilters,
    setPage,
    setSelectedPayment,
    clearCurrentPreference,
    clearError,
    clearPayments,
    handlePaymentCreated,
    handlePaymentUpdated,
    handlePaymentStatusChanged,
  } = usePaymentsStore();

  // Memoized callbacks for stable references
  const handleLoadPayments = useCallback(
    (params?: QueryPaymentParams) => loadPayments(params),
    [loadPayments],
  );

  const handleLoadPayment = useCallback((id: string) => loadPayment(id), [loadPayment]);

  const handleCreatePreference = useCallback(
    (data: CreatePreferenceRequest) => createPreference(data),
    [createPreference],
  );

  const handleGetPaymentStatus = useCallback(
    (id: string) => getPaymentStatus(id),
    [getPaymentStatus],
  );

  const handleRefreshPaymentStatus = useCallback(
    (id: string) => refreshPaymentStatus(id),
    [refreshPaymentStatus],
  );

  const handleLoadBookingPayments = useCallback(
    (bookingId: string) => loadBookingPayments(bookingId),
    [loadBookingPayments],
  );

  const handleSetFilters = useCallback(
    (newFilters: Partial<typeof filters>) => setFilters(newFilters),
    [setFilters],
  );

  const handleResetFilters = useCallback(() => resetFilters(), [resetFilters]);
  const handleSetPage = useCallback((page: number) => setPage(page), [setPage]);

  const handleSetSelectedPayment = useCallback(
    (payment: Payment | null) => setSelectedPayment(payment),
    [setSelectedPayment],
  );

  const handleClearCurrentPreference = useCallback(
    () => clearCurrentPreference(),
    [clearCurrentPreference],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);
  const handleClearPayments = useCallback(() => clearPayments(), [clearPayments]);

  return {
    // State
    payments,
    selectedPayment,
    currentPreference,
    pagination,
    filters,
    loading,
    loadingPayment,
    creatingPreference,
    refreshingStatus,
    error,

    // Actions
    loadPayments: handleLoadPayments,
    loadPayment: handleLoadPayment,
    createPreference: handleCreatePreference,
    getPaymentStatus: handleGetPaymentStatus,
    refreshPaymentStatus: handleRefreshPaymentStatus,
    loadBookingPayments: handleLoadBookingPayments,
    setFilters: handleSetFilters,
    resetFilters: handleResetFilters,
    setPage: handleSetPage,
    setSelectedPayment: handleSetSelectedPayment,
    clearCurrentPreference: handleClearCurrentPreference,
    clearError: handleClearError,
    clearPayments: handleClearPayments,

    // Socket handlers
    handlePaymentCreated,
    handlePaymentUpdated,
    handlePaymentStatusChanged,
  };
}

/**
 * Hook to auto-load payments on mount
 */
export function usePaymentsLoader(params?: QueryPaymentParams) {
  const { loadPayments, payments, loading, error, pagination } = usePayments();

  useEffect(() => {
    loadPayments(params);
  }, [
    loadPayments,
    params?.page,
    params?.limit,
    params?.bookingId,
    params?.customerId,
    params?.type,
    params?.status,
    params?.search,
  ]);

  return { payments, loading, error, pagination };
}

/**
 * Hook to load payments for a specific booking
 */
export function useBookingPayments(bookingId: string | undefined) {
  const { loadBookingPayments, loading, error } = usePayments();
  const bookingPayments = usePaymentsStore((state) =>
    bookingId ? state.bookingPayments.get(bookingId) : undefined,
  );

  useEffect(() => {
    if (bookingId) {
      loadBookingPayments(bookingId);
    }
  }, [bookingId, loadBookingPayments]);

  return {
    payments: bookingPayments || [],
    loading,
    error,
  };
}

/**
 * Hook to load a single payment by ID
 */
export function usePaymentById(id: string | undefined) {
  const { loadPayment, selectedPayment, loadingPayment, error } = usePayments();

  useEffect(() => {
    if (id) {
      loadPayment(id);
    }
  }, [id, loadPayment]);

  return { payment: selectedPayment, loading: loadingPayment, error };
}

/**
 * Hook for creating payment preferences (payment links)
 */
export function useCreatePaymentPreference() {
  const { createPreference, currentPreference, creatingPreference, error, clearError, clearCurrentPreference } =
    usePayments();

  const handleCreate = useCallback(
    async (bookingId: string, type: PaymentType, options?: { payerEmail?: string; payerName?: string }) => {
      return createPreference({
        bookingId,
        type,
        payerEmail: options?.payerEmail,
        payerName: options?.payerName,
      });
    },
    [createPreference],
  );

  return {
    createPreference: handleCreate,
    preference: currentPreference,
    isCreating: creatingPreference,
    error,
    clearError,
    clearPreference: clearCurrentPreference,
  };
}

/**
 * Hook for payment status polling
 * Useful for waiting for payment confirmation
 */
export function usePaymentStatusPolling(paymentId: string | undefined, intervalMs = 5000) {
  const { getPaymentStatus, refreshPaymentStatus } = usePayments();

  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const status = await getPaymentStatus(paymentId);
        if (status.isCompleted || status.isFailed) {
          // Stop polling once payment reaches a final state
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Initial check
    checkStatus();

    // Set up polling interval
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [paymentId, intervalMs, getPaymentStatus]);
}

/**
 * Hook for manual payment status refresh
 */
export function usePaymentStatusRefresh() {
  const { refreshPaymentStatus, refreshingStatus, error, clearError } = usePayments();

  return {
    refreshStatus: refreshPaymentStatus,
    isRefreshing: refreshingStatus,
    error,
    clearError,
  };
}

/**
 * Hook for payment filtering
 */
export function usePaymentFilters() {
  const { filters, setFilters, resetFilters, loadPayments } = usePayments();

  const applyFilters = useCallback(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    filters,
    setFilters,
    resetFilters,
    applyFilters,
  };
}

/**
 * Hook to handle payment socket events
 * Automatically updates payment store when receiving socket events
 */
export function usePaymentSocketEvents() {
  const {
    handlePaymentCreated,
    handlePaymentUpdated,
    handlePaymentStatusChanged,
  } = usePayments();

  // Return handlers for use with usePaymentEvents hook
  return {
    onCreated: handlePaymentCreated,
    onUpdated: handlePaymentUpdated,
    onStatusChanged: useCallback(
      (data: { paymentId: string; status: PaymentStatus }) => {
        handlePaymentStatusChanged(data.paymentId, data.status);
      },
      [handlePaymentStatusChanged],
    ),
  };
}
