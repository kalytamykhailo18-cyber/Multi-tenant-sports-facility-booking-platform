// Subscriptions Hooks
// Custom hooks for subscription management

'use client';

import { useCallback, useEffect } from 'react';
import { useSubscriptionsStore } from '@/stores/subscriptions.store';
import type {
  QuerySubscriptionParams,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@/lib/subscriptions-api';

/**
 * Main hook for subscription management
 * Provides all subscription-related state and actions
 */
export function useSubscriptions() {
  const {
    subscriptions,
    selectedSubscription,
    pagination,
    loading,
    loadingSubscription,
    creating,
    updating,
    suspending,
    reactivating,
    cancelling,
    error,
    loadSubscriptions,
    loadSubscription,
    loadSubscriptionByTenant,
    create,
    update,
    suspend,
    reactivate,
    cancel,
    checkStatuses,
    setSelectedSubscription,
    clearError,
  } = useSubscriptionsStore();

  // Memoized callbacks for stable references
  const handleLoadSubscriptions = useCallback(
    (params?: QuerySubscriptionParams) => loadSubscriptions(params),
    [loadSubscriptions],
  );

  const handleLoadSubscription = useCallback(
    (id: string) => loadSubscription(id),
    [loadSubscription],
  );

  const handleLoadSubscriptionByTenant = useCallback(
    (tenantId: string) => loadSubscriptionByTenant(tenantId),
    [loadSubscriptionByTenant],
  );

  const handleCreate = useCallback(
    (data: CreateSubscriptionRequest) => create(data),
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateSubscriptionRequest) => update(id, data),
    [update],
  );

  const handleSuspend = useCallback(
    (id: string, reason?: string) => suspend(id, reason),
    [suspend],
  );

  const handleReactivate = useCallback(
    (id: string) => reactivate(id),
    [reactivate],
  );

  const handleCancel = useCallback(
    (id: string, reason?: string) => cancel(id, reason),
    [cancel],
  );

  const handleCheckStatuses = useCallback(
    () => checkStatuses(),
    [checkStatuses],
  );

  const handleSetSelectedSubscription = useCallback(
    (subscription: typeof selectedSubscription) => setSelectedSubscription(subscription),
    [setSelectedSubscription],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  return {
    // State
    subscriptions,
    selectedSubscription,
    pagination,
    loading,
    loadingSubscription,
    creating,
    updating,
    suspending,
    reactivating,
    cancelling,
    error,

    // Actions
    loadSubscriptions: handleLoadSubscriptions,
    loadSubscription: handleLoadSubscription,
    loadSubscriptionByTenant: handleLoadSubscriptionByTenant,
    create: handleCreate,
    update: handleUpdate,
    suspend: handleSuspend,
    reactivate: handleReactivate,
    cancel: handleCancel,
    checkStatuses: handleCheckStatuses,
    setSelectedSubscription: handleSetSelectedSubscription,
    clearError: handleClearError,
  };
}

/**
 * Hook to auto-load subscriptions on mount
 */
export function useSubscriptionsLoader(params?: QuerySubscriptionParams) {
  const { loadSubscriptions, subscriptions, loading, error, pagination } = useSubscriptions();

  useEffect(() => {
    loadSubscriptions(params);
  }, [loadSubscriptions, params?.page, params?.limit, params?.status, params?.tenantId]);

  return { subscriptions, loading, error, pagination };
}

/**
 * Hook to load a single subscription by ID
 */
export function useSubscriptionById(id: string | undefined) {
  const { loadSubscription, selectedSubscription, loadingSubscription, error } = useSubscriptions();

  useEffect(() => {
    if (id) {
      loadSubscription(id);
    }
  }, [id, loadSubscription]);

  return { subscription: selectedSubscription, loading: loadingSubscription, error };
}

/**
 * Hook to load subscription for a specific tenant
 */
export function useSubscriptionByTenant(tenantId: string | undefined) {
  const { loadSubscriptionByTenant, selectedSubscription, loadingSubscription, error } = useSubscriptions();

  useEffect(() => {
    if (tenantId) {
      loadSubscriptionByTenant(tenantId);
    }
  }, [tenantId, loadSubscriptionByTenant]);

  return { subscription: selectedSubscription, loading: loadingSubscription, error };
}
