// Credits Hooks
// Custom hooks for customer credit management

'use client';

import { useCallback, useEffect } from 'react';
import { useCreditsStore } from '@/stores/credits.store';
import type {
  QueryCreditParams,
  CreateCreditRequest,
  UseCreditRequest,
  Credit,
  CreditReason,
} from '@/lib/credits-api';

/**
 * Main hook for credit management
 * Provides all credit-related state and actions
 */
export function useCredits() {
  const {
    credits,
    selectedCredit,
    customerBalances,
    pagination,
    filters,
    loading,
    loadingCredit,
    loadingBalance,
    creating,
    usingCredit,
    deactivating,
    error,
    loadCredits,
    loadCredit,
    loadCustomerBalance,
    create,
    useCredits: useCreditsAction,
    deactivate,
    loadBookingCredits,
    setFilters,
    resetFilters,
    setPage,
    setSelectedCredit,
    clearError,
    clearCredits,
    handleCreditCreated,
    handleCreditUpdated,
    handleCreditUsed,
  } = useCreditsStore();

  // Memoized callbacks for stable references
  const handleLoadCredits = useCallback(
    (params?: QueryCreditParams) => loadCredits(params),
    [loadCredits],
  );

  const handleLoadCredit = useCallback((id: string) => loadCredit(id), [loadCredit]);

  const handleLoadCustomerBalance = useCallback(
    (customerId: string) => loadCustomerBalance(customerId),
    [loadCustomerBalance],
  );

  const handleCreate = useCallback(
    (data: CreateCreditRequest) => create(data),
    [create],
  );

  const handleUseCredits = useCallback(
    (data: UseCreditRequest) => useCreditsAction(data),
    [useCreditsAction],
  );

  const handleDeactivate = useCallback(
    (id: string, reason?: string) => deactivate(id, reason),
    [deactivate],
  );

  const handleLoadBookingCredits = useCallback(
    (bookingId: string) => loadBookingCredits(bookingId),
    [loadBookingCredits],
  );

  const handleSetFilters = useCallback(
    (newFilters: Partial<typeof filters>) => setFilters(newFilters),
    [setFilters],
  );

  const handleResetFilters = useCallback(() => resetFilters(), [resetFilters]);
  const handleSetPage = useCallback((page: number) => setPage(page), [setPage]);

  const handleSetSelectedCredit = useCallback(
    (credit: Credit | null) => setSelectedCredit(credit),
    [setSelectedCredit],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);
  const handleClearCredits = useCallback(() => clearCredits(), [clearCredits]);

  return {
    // State
    credits,
    selectedCredit,
    customerBalances,
    pagination,
    filters,
    loading,
    loadingCredit,
    loadingBalance,
    creating,
    usingCredit,
    deactivating,
    error,

    // Actions
    loadCredits: handleLoadCredits,
    loadCredit: handleLoadCredit,
    loadCustomerBalance: handleLoadCustomerBalance,
    create: handleCreate,
    useCredits: handleUseCredits,
    deactivate: handleDeactivate,
    loadBookingCredits: handleLoadBookingCredits,
    setFilters: handleSetFilters,
    resetFilters: handleResetFilters,
    setPage: handleSetPage,
    setSelectedCredit: handleSetSelectedCredit,
    clearError: handleClearError,
    clearCredits: handleClearCredits,

    // Socket handlers
    handleCreditCreated,
    handleCreditUpdated,
    handleCreditUsed,
  };
}

/**
 * Hook to auto-load credits on mount
 */
export function useCreditsLoader(params?: QueryCreditParams) {
  const { loadCredits, credits, loading, error, pagination } = useCredits();

  useEffect(() => {
    loadCredits(params);
  }, [
    loadCredits,
    params?.page,
    params?.limit,
    params?.customerId,
    params?.reason,
    params?.isActive,
    params?.hasBalance,
    params?.includeExpired,
  ]);

  return { credits, loading, error, pagination };
}

/**
 * Hook to load customer credit balance
 */
export function useCustomerCreditBalance(customerId: string | undefined) {
  const { loadCustomerBalance, loadingBalance, error } = useCredits();
  const balance = useCreditsStore((state) =>
    customerId ? state.customerBalances.get(customerId) : undefined,
  );

  useEffect(() => {
    if (customerId) {
      loadCustomerBalance(customerId);
    }
  }, [customerId, loadCustomerBalance]);

  return {
    balance,
    totalBalance: balance?.totalBalance || 0,
    activeCreditsCount: balance?.activeCreditsCount || 0,
    credits: balance?.credits || [],
    loading: loadingBalance,
    error,
    reload: () => customerId && loadCustomerBalance(customerId),
  };
}

/**
 * Hook to load a single credit by ID
 */
export function useCreditById(id: string | undefined) {
  const { loadCredit, selectedCredit, loadingCredit, error } = useCredits();

  useEffect(() => {
    if (id) {
      loadCredit(id);
    }
  }, [id, loadCredit]);

  return { credit: selectedCredit, loading: loadingCredit, error };
}

/**
 * Hook for creating credits
 */
export function useCreateCredit() {
  const { create, creating, error, clearError } = useCredits();

  const handleCreate = useCallback(
    async (
      customerId: string,
      amount: number,
      reason: CreditReason,
      options?: {
        description?: string;
        expiresAt?: string;
        sourceBookingId?: string;
        sourcePaymentId?: string;
      },
    ) => {
      return create({
        customerId,
        amount,
        reason,
        ...options,
      });
    },
    [create],
  );

  return {
    createCredit: handleCreate,
    isCreating: creating,
    error,
    clearError,
  };
}

/**
 * Hook for using/applying credits to a booking
 */
export function useApplyCredits() {
  const { useCredits: applyCredits, usingCredit, error, clearError } = useCredits();

  const handleApply = useCallback(
    async (customerId: string, bookingId: string, amount: number, creditIds?: string[]) => {
      return applyCredits({
        customerId,
        bookingId,
        amount,
        creditIds,
      });
    },
    [applyCredits],
  );

  return {
    applyCredits: handleApply,
    isApplying: usingCredit,
    error,
    clearError,
  };
}

/**
 * Hook for deactivating credits
 */
export function useDeactivateCredit() {
  const { deactivate, deactivating, error, clearError } = useCredits();

  return {
    deactivate,
    isDeactivating: deactivating,
    error,
    clearError,
  };
}

/**
 * Hook for credits created from a specific booking (e.g., from cancellation)
 */
export function useBookingCredits(bookingId: string | undefined) {
  const { loadBookingCredits, error } = useCredits();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      setLoading(true);
      loadBookingCredits(bookingId)
        .then(setCredits)
        .catch(() => setCredits([]))
        .finally(() => setLoading(false));
    } else {
      setCredits([]);
    }
  }, [bookingId, loadBookingCredits]);

  return { credits, loading, error };
}

// Import useState for useBookingCredits
import { useState } from 'react';

/**
 * Hook for credit filtering
 */
export function useCreditFilters() {
  const { filters, setFilters, resetFilters, loadCredits } = useCredits();

  const applyFilters = useCallback(() => {
    loadCredits();
  }, [loadCredits]);

  return {
    filters,
    setFilters,
    resetFilters,
    applyFilters,
  };
}

/**
 * Hook to check if customer has enough credit for an amount
 */
export function useCustomerHasCredit(customerId: string | undefined, amount: number) {
  const { balance, loading } = useCustomerCreditBalance(customerId);

  const hasEnoughCredit = (balance?.totalBalance || 0) >= amount;
  const availableCredit = balance?.totalBalance || 0;
  const shortfall = amount > availableCredit ? amount - availableCredit : 0;

  return {
    hasEnoughCredit,
    availableCredit,
    shortfall,
    loading,
  };
}
