// Courts Hooks
// Custom hooks for court management

'use client';

import { useCallback, useEffect } from 'react';
import { useCourtsStore } from '@/stores/courts.store';
import type {
  QueryCourtParams,
  CreateCourtRequest,
  UpdateCourtRequest,
  CourtStatus,
  ReorderCourtsRequest,
} from '@/lib/courts-api';

/**
 * Main hook for court management
 * Provides all court-related state and actions
 */
export function useCourts() {
  const {
    courts,
    selectedCourt,
    pagination,
    loading,
    loadingCourt,
    creating,
    updating,
    deleting,
    reordering,
    error,
    loadCourts,
    loadCourtsByFacility,
    loadCourt,
    create,
    update,
    updateStatus,
    reorder,
    remove,
    setSelectedCourt,
    clearError,
    clearCourts,
    handleCourtCreated,
    handleCourtUpdated,
    handleCourtDeleted,
    handleCourtsReordered,
  } = useCourtsStore();

  // Memoized callbacks for stable references
  const handleLoadCourts = useCallback(
    (params?: QueryCourtParams) => loadCourts(params),
    [loadCourts],
  );

  const handleLoadCourtsByFacility = useCallback(
    (facilityId: string) => loadCourtsByFacility(facilityId),
    [loadCourtsByFacility],
  );

  const handleLoadCourt = useCallback(
    (id: string) => loadCourt(id),
    [loadCourt],
  );

  const handleCreate = useCallback(
    (data: CreateCourtRequest) => create(data),
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateCourtRequest) => update(id, data),
    [update],
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: CourtStatus) => updateStatus(id, status),
    [updateStatus],
  );

  const handleReorder = useCallback(
    (data: ReorderCourtsRequest) => reorder(data),
    [reorder],
  );

  const handleRemove = useCallback(
    (id: string) => remove(id),
    [remove],
  );

  const handleSetSelectedCourt = useCallback(
    (court: typeof selectedCourt) => setSelectedCourt(court),
    [setSelectedCourt],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  const handleClearCourts = useCallback(() => clearCourts(), [clearCourts]);

  return {
    // State
    courts,
    selectedCourt,
    pagination,
    loading,
    loadingCourt,
    creating,
    updating,
    deleting,
    reordering,
    error,

    // Actions
    loadCourts: handleLoadCourts,
    loadCourtsByFacility: handleLoadCourtsByFacility,
    loadCourt: handleLoadCourt,
    create: handleCreate,
    update: handleUpdate,
    updateStatus: handleUpdateStatus,
    reorder: handleReorder,
    remove: handleRemove,
    setSelectedCourt: handleSetSelectedCourt,
    clearError: handleClearError,
    clearCourts: handleClearCourts,

    // Socket handlers (for real-time updates)
    handleCourtCreated,
    handleCourtUpdated,
    handleCourtDeleted,
    handleCourtsReordered,
  };
}

/**
 * Hook to auto-load courts on mount
 */
export function useCourtsLoader(params?: QueryCourtParams) {
  const { loadCourts, courts, loading, error, pagination } = useCourts();

  useEffect(() => {
    loadCourts(params);
  }, [
    loadCourts,
    params?.page,
    params?.limit,
    params?.facilityId,
    params?.status,
    params?.sportType,
    params?.search,
  ]);

  return { courts, loading, error, pagination };
}

/**
 * Hook to auto-load courts by facility ID on mount
 */
export function useCourtsByFacility(facilityId: string | undefined) {
  const { loadCourtsByFacility, courts, loading, error, clearCourts } = useCourts();

  useEffect(() => {
    if (facilityId) {
      loadCourtsByFacility(facilityId);
    } else {
      clearCourts();
    }
  }, [facilityId, loadCourtsByFacility, clearCourts]);

  // Filter courts by facilityId in case store has courts from multiple facilities
  const facilityCourts = facilityId
    ? courts.filter((c) => c.facilityId === facilityId)
    : courts;

  return { courts: facilityCourts, loading, error };
}

/**
 * Hook to load a single court by ID
 */
export function useCourtById(id: string | undefined) {
  const { loadCourt, selectedCourt, loadingCourt, error } = useCourts();

  useEffect(() => {
    if (id) {
      loadCourt(id);
    }
  }, [id, loadCourt]);

  return { court: selectedCourt, loading: loadingCourt, error };
}

/**
 * Hook for court form operations (create/update)
 */
export function useCourtForm() {
  const { create, update, creating, updating, error, clearError } = useCourts();

  const isSubmitting = creating || updating;

  const handleSubmit = useCallback(
    async (data: CreateCourtRequest | (UpdateCourtRequest & { id: string })) => {
      if ('id' in data && data.id) {
        const { id, ...updateData } = data;
        return update(id, updateData);
      }
      return create(data as CreateCourtRequest);
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
 * Hook for managing court status updates
 */
export function useCourtStatus() {
  const { updateStatus, updating, error } = useCourts();

  return {
    updateStatus,
    isUpdating: updating,
    error,
  };
}

/**
 * Hook for court reordering (drag and drop)
 */
export function useCourtReorder(facilityId: string) {
  const { reorder, reordering, error, courts } = useCourts();

  const handleReorder = useCallback(
    async (courtIds: string[]) => {
      return reorder({ facilityId, courtIds });
    },
    [facilityId, reorder],
  );

  const facilityCourts = courts.filter((c) => c.facilityId === facilityId);

  return {
    courts: facilityCourts,
    reorder: handleReorder,
    isReordering: reordering,
    error,
  };
}
