// Customers Hooks
// Custom hooks for customer management

'use client';

import { useCallback, useEffect } from 'react';
import { useCustomersStore } from '@/stores/customers.store';
import type {
  QueryCustomerParams,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  BlockCustomerRequest,
  UpdateReputationRequest,
  AddCreditRequest,
  AddNoteRequest,
  ReputationLevel,
  CustomerWithRelations,
} from '@/lib/customers-api';

/**
 * Main hook for customer management
 * Provides all customer-related state and actions
 */
export function useCustomers() {
  const {
    customers,
    selectedCustomer,
    pagination,
    filters,
    loading,
    loadingCustomer,
    creating,
    updating,
    blocking,
    updatingReputation,
    addingCredit,
    addingNote,
    loadingNotes,
    loadingHistory,
    error,
    loadCustomers,
    loadCustomer,
    findByPhone,
    create,
    update,
    setBlocked,
    updateReputation,
    addCredit,
    addNote,
    loadNotes,
    loadReputationHistory,
    setFilters,
    resetFilters,
    setPage,
    setSelectedCustomer,
    clearError,
    clearCustomers,
    handleCustomerCreated,
    handleCustomerUpdated,
    handleCustomerBlocked,
    handleReputationUpdated,
    handleCreditUpdated,
    handleNoteAdded,
  } = useCustomersStore();

  // Memoized callbacks for stable references
  const handleLoadCustomers = useCallback(
    (params?: QueryCustomerParams) => loadCustomers(params),
    [loadCustomers],
  );

  const handleLoadCustomer = useCallback(
    (id: string) => loadCustomer(id),
    [loadCustomer],
  );

  const handleFindByPhone = useCallback(
    (phone: string) => findByPhone(phone),
    [findByPhone],
  );

  const handleCreate = useCallback(
    (data: CreateCustomerRequest) => create(data),
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateCustomerRequest) => update(id, data),
    [update],
  );

  const handleSetBlocked = useCallback(
    (id: string, data: BlockCustomerRequest) => setBlocked(id, data),
    [setBlocked],
  );

  const handleUpdateReputation = useCallback(
    (id: string, data: UpdateReputationRequest) => updateReputation(id, data),
    [updateReputation],
  );

  const handleAddCredit = useCallback(
    (id: string, data: AddCreditRequest) => addCredit(id, data),
    [addCredit],
  );

  const handleAddNote = useCallback(
    (id: string, data: AddNoteRequest) => addNote(id, data),
    [addNote],
  );

  const handleLoadNotes = useCallback(
    (id: string, limit?: number) => loadNotes(id, limit),
    [loadNotes],
  );

  const handleLoadReputationHistory = useCallback(
    (id: string, limit?: number) => loadReputationHistory(id, limit),
    [loadReputationHistory],
  );

  const handleSetFilters = useCallback(
    (newFilters: Partial<typeof filters>) => setFilters(newFilters),
    [setFilters],
  );

  const handleResetFilters = useCallback(() => resetFilters(), [resetFilters]);

  const handleSetPage = useCallback((page: number) => setPage(page), [setPage]);

  const handleSetSelectedCustomer = useCallback(
    (customer: CustomerWithRelations | null) => setSelectedCustomer(customer),
    [setSelectedCustomer],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  const handleClearCustomers = useCallback(() => clearCustomers(), [clearCustomers]);

  return {
    // State
    customers,
    selectedCustomer,
    pagination,
    filters,
    loading,
    loadingCustomer,
    creating,
    updating,
    blocking,
    updatingReputation,
    addingCredit,
    addingNote,
    loadingNotes,
    loadingHistory,
    error,

    // Actions
    loadCustomers: handleLoadCustomers,
    loadCustomer: handleLoadCustomer,
    findByPhone: handleFindByPhone,
    create: handleCreate,
    update: handleUpdate,
    setBlocked: handleSetBlocked,
    updateReputation: handleUpdateReputation,
    addCredit: handleAddCredit,
    addNote: handleAddNote,
    loadNotes: handleLoadNotes,
    loadReputationHistory: handleLoadReputationHistory,
    setFilters: handleSetFilters,
    resetFilters: handleResetFilters,
    setPage: handleSetPage,
    setSelectedCustomer: handleSetSelectedCustomer,
    clearError: handleClearError,
    clearCustomers: handleClearCustomers,

    // Socket handlers (for real-time updates)
    handleCustomerCreated,
    handleCustomerUpdated,
    handleCustomerBlocked,
    handleReputationUpdated,
    handleCreditUpdated,
    handleNoteAdded,
  };
}

/**
 * Hook to auto-load customers on mount with filters
 */
export function useCustomersLoader(params?: QueryCustomerParams) {
  const { loadCustomers, customers, loading, error, pagination, filters } = useCustomers();

  useEffect(() => {
    loadCustomers(params);
  }, [
    loadCustomers,
    params?.page,
    params?.limit,
    params?.search,
    params?.reputationLevel,
    params?.isBlocked,
    params?.hasCredit,
    params?.sortBy,
    params?.sortOrder,
  ]);

  return { customers, loading, error, pagination, filters };
}

/**
 * Hook to load customers list with filters from store
 */
export function useCustomersListLoader() {
  const { loadCustomers, customers, loading, error, pagination, filters } = useCustomers();

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers, pagination.page, filters]);

  return { customers, loading, error, pagination, filters };
}

/**
 * Hook to load a single customer by ID
 */
export function useCustomerById(id: string | undefined) {
  const { loadCustomer, selectedCustomer, loadingCustomer, error } = useCustomers();

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id, loadCustomer]);

  return { customer: selectedCustomer, loading: loadingCustomer, error };
}

/**
 * Hook for customer form operations (create/update)
 */
export function useCustomerForm() {
  const { create, update, creating, updating, error, clearError } = useCustomers();

  const isSubmitting = creating || updating;

  const handleSubmit = useCallback(
    async (data: CreateCustomerRequest | (UpdateCustomerRequest & { id: string })) => {
      if ('id' in data && data.id) {
        const { id, ...updateData } = data;
        return update(id, updateData);
      }
      return create(data as CreateCustomerRequest);
    },
    [create, update],
  );

  return {
    submit: handleSubmit,
    isSubmitting,
    error,
    clearError,
  };
}

/**
 * Hook for customer blocking operations
 */
export function useCustomerBlock() {
  const { setBlocked, blocking, error } = useCustomers();

  const handleBlock = useCallback(
    (id: string, reason?: string) => setBlocked(id, { block: true, reason }),
    [setBlocked],
  );

  const handleUnblock = useCallback(
    (id: string) => setBlocked(id, { block: false }),
    [setBlocked],
  );

  return {
    block: handleBlock,
    unblock: handleUnblock,
    isBlocking: blocking,
    error,
  };
}

/**
 * Hook for customer reputation management
 */
export function useCustomerReputation() {
  const {
    updateReputation,
    loadReputationHistory,
    updatingReputation,
    loadingHistory,
    selectedCustomer,
    error,
  } = useCustomers();

  const handleUpdateReputation = useCallback(
    (id: string, score: number, reason?: string) => updateReputation(id, { score, reason }),
    [updateReputation],
  );

  return {
    updateReputation: handleUpdateReputation,
    loadHistory: loadReputationHistory,
    isUpdating: updatingReputation,
    isLoadingHistory: loadingHistory,
    history: selectedCustomer?.reputationHistory || [],
    error,
  };
}

/**
 * Hook for customer credit management
 */
export function useCustomerCredit() {
  const { addCredit, addingCredit, selectedCustomer, error } = useCustomers();

  const handleAddCredit = useCallback(
    (id: string, amount: number, reason?: string) => addCredit(id, { amount, reason }),
    [addCredit],
  );

  return {
    addCredit: handleAddCredit,
    isAdding: addingCredit,
    creditBalance: selectedCustomer?.creditBalance || 0,
    error,
  };
}

/**
 * Hook for customer notes management
 */
export function useCustomerNotes() {
  const { addNote, loadNotes, addingNote, loadingNotes, selectedCustomer, error } = useCustomers();

  const handleAddNote = useCallback(
    (id: string, content: string) => addNote(id, { content }),
    [addNote],
  );

  return {
    addNote: handleAddNote,
    loadNotes,
    isAdding: addingNote,
    isLoading: loadingNotes,
    notes: selectedCustomer?.recentNotes || [],
    error,
  };
}

/**
 * Hook for customer filters
 */
export function useCustomerFilters() {
  const { filters, setFilters, resetFilters, loadCustomers } = useCustomers();

  const handleSearchChange = useCallback(
    (search: string) => {
      setFilters({ search });
    },
    [setFilters],
  );

  const handleReputationFilterChange = useCallback(
    (reputationLevel: ReputationLevel | null) => {
      setFilters({ reputationLevel });
    },
    [setFilters],
  );

  const handleBlockedFilterChange = useCallback(
    (isBlocked: boolean | null) => {
      setFilters({ isBlocked });
    },
    [setFilters],
  );

  const handleCreditFilterChange = useCallback(
    (hasCredit: boolean | null) => {
      setFilters({ hasCredit });
    },
    [setFilters],
  );

  const handleSortChange = useCallback(
    (sortBy: typeof filters.sortBy, sortOrder: 'asc' | 'desc') => {
      setFilters({ sortBy, sortOrder });
    },
    [setFilters],
  );

  const applyFilters = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    filters,
    setSearch: handleSearchChange,
    setReputationFilter: handleReputationFilterChange,
    setBlockedFilter: handleBlockedFilterChange,
    setCreditFilter: handleCreditFilterChange,
    setSort: handleSortChange,
    resetFilters,
    applyFilters,
  };
}
