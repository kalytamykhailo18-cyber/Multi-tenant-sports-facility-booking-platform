// Tenants Hook
// Provides tenant management functionality to components

'use client';

import { useCallback, useEffect } from 'react';
import { useTenantsStore } from '@/stores/tenants.store';
import type {
  CreateTenantRequest,
  UpdateTenantRequest,
  QueryTenantParams,
} from '@/lib/tenants-api';

/**
 * Main hook for tenant management
 * Components use this hook to interact with tenant data
 */
export function useTenants() {
  const {
    // State
    tenants,
    selectedTenant,
    pagination,
    loading,
    loadingTenant,
    creating,
    updating,
    deleting,
    error,
    // Actions
    fetchTenants,
    fetchTenantById,
    createTenant,
    updateTenant,
    deleteTenant,
    suspendTenant,
    reactivateTenant,
    selectTenant,
    clearError,
    reset,
  } = useTenantsStore();

  // Wrap actions in useCallback for stability
  const loadTenants = useCallback(
    async (params?: QueryTenantParams) => {
      await fetchTenants(params);
    },
    [fetchTenants]
  );

  const loadTenantById = useCallback(
    async (id: string) => {
      return fetchTenantById(id);
    },
    [fetchTenantById]
  );

  const create = useCallback(
    async (data: CreateTenantRequest) => {
      return createTenant(data);
    },
    [createTenant]
  );

  const update = useCallback(
    async (id: string, data: UpdateTenantRequest) => {
      return updateTenant(id, data);
    },
    [updateTenant]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTenant(id);
    },
    [deleteTenant]
  );

  const suspend = useCallback(
    async (id: string, reason?: string) => {
      return suspendTenant(id, reason);
    },
    [suspendTenant]
  );

  const reactivate = useCallback(
    async (id: string) => {
      return reactivateTenant(id);
    },
    [reactivateTenant]
  );

  const select = useCallback(
    (tenant: typeof selectedTenant) => {
      selectTenant(tenant);
    },
    [selectTenant]
  );

  const clearErr = useCallback(() => {
    clearError();
  }, [clearError]);

  const resetStore = useCallback(() => {
    reset();
  }, [reset]);

  return {
    // State
    tenants,
    selectedTenant,
    pagination,
    loading,
    loadingTenant,
    creating,
    updating,
    deleting,
    error,
    // Combined loading state
    isLoading: loading || loadingTenant || creating || updating || deleting,

    // Actions
    loadTenants,
    loadTenantById,
    create,
    update,
    remove,
    suspend,
    reactivate,
    select,
    clearError: clearErr,
    reset: resetStore,
  };
}

/**
 * Hook to load tenants on mount
 * Use in pages that need to display tenant list
 */
export function useTenantsLoader(params?: QueryTenantParams) {
  const { loadTenants, tenants, loading, error } = useTenants();

  useEffect(() => {
    loadTenants(params);
  }, [loadTenants, params?.page, params?.limit, params?.status, params?.search]);

  return { tenants, loading, error };
}

/**
 * Hook to load a single tenant by ID
 * Use in pages that need to display tenant details
 */
export function useTenantById(id: string | null) {
  const { loadTenantById, selectedTenant, loadingTenant, error } = useTenants();

  useEffect(() => {
    if (id) {
      loadTenantById(id);
    }
  }, [id, loadTenantById]);

  return { tenant: selectedTenant, loading: loadingTenant, error };
}
