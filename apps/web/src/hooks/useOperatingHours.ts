// Operating Hours Hooks
// Custom hooks for operating hours management

'use client';

import { useCallback, useEffect } from 'react';
import { useOperatingHoursStore } from '@/stores/operating-hours.store';
import type {
  UpdateOperatingHoursRequest,
  BulkUpdateOperatingHoursRequest,
  CreateSpecialHoursRequest,
  UpdateSpecialHoursRequest,
  QuerySpecialHoursParams,
  WeeklySchedule,
  SpecialHours,
} from '@/lib/operating-hours-api';

/**
 * Main hook for operating hours management
 * Provides all operating hours-related state and actions
 */
export function useOperatingHours() {
  const {
    weeklySchedule,
    specialHours,
    specialHoursTotal,
    loading,
    loadingSpecialHours,
    updating,
    creatingDefaults,
    creatingSpecialHours,
    updatingSpecialHours,
    deletingSpecialHours,
    error,
    loadByFacility,
    update,
    bulkUpdate,
    createDefaults,
    loadSpecialHours,
    createSpecialHours,
    updateSpecialHours,
    deleteSpecialHours,
    clearError,
    clear,
    handleOperatingHoursUpdated,
    handleSpecialHoursCreated,
    handleSpecialHoursUpdated,
    handleSpecialHoursDeleted,
  } = useOperatingHoursStore();

  // Memoized callbacks for stable references
  const handleLoadByFacility = useCallback(
    (facilityId: string) => loadByFacility(facilityId),
    [loadByFacility],
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateOperatingHoursRequest) => update(id, data),
    [update],
  );

  const handleBulkUpdate = useCallback(
    (facilityId: string, data: BulkUpdateOperatingHoursRequest) => bulkUpdate(facilityId, data),
    [bulkUpdate],
  );

  const handleCreateDefaults = useCallback(
    (facilityId: string) => createDefaults(facilityId),
    [createDefaults],
  );

  const handleLoadSpecialHours = useCallback(
    (facilityId: string, params?: QuerySpecialHoursParams) => loadSpecialHours(facilityId, params),
    [loadSpecialHours],
  );

  const handleCreateSpecialHours = useCallback(
    (data: CreateSpecialHoursRequest) => createSpecialHours(data),
    [createSpecialHours],
  );

  const handleUpdateSpecialHours = useCallback(
    (id: string, data: UpdateSpecialHoursRequest) => updateSpecialHours(id, data),
    [updateSpecialHours],
  );

  const handleDeleteSpecialHours = useCallback(
    (id: string) => deleteSpecialHours(id),
    [deleteSpecialHours],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  const handleClear = useCallback(() => clear(), [clear]);

  return {
    // State
    weeklySchedule,
    specialHours,
    specialHoursTotal,
    loading,
    loadingSpecialHours,
    updating,
    creatingDefaults,
    creatingSpecialHours,
    updatingSpecialHours,
    deletingSpecialHours,
    error,

    // Actions - Operating Hours
    loadByFacility: handleLoadByFacility,
    update: handleUpdate,
    bulkUpdate: handleBulkUpdate,
    createDefaults: handleCreateDefaults,

    // Actions - Special Hours
    loadSpecialHours: handleLoadSpecialHours,
    createSpecialHours: handleCreateSpecialHours,
    updateSpecialHours: handleUpdateSpecialHours,
    deleteSpecialHours: handleDeleteSpecialHours,

    // Utility
    clearError: handleClearError,
    clear: handleClear,

    // Socket handlers (for real-time updates)
    handleOperatingHoursUpdated,
    handleSpecialHoursCreated,
    handleSpecialHoursUpdated,
    handleSpecialHoursDeleted,
  };
}

/**
 * Hook to auto-load operating hours by facility ID on mount
 */
export function useOperatingHoursByFacility(facilityId: string | undefined) {
  const { loadByFacility, weeklySchedule, loading, error, clear } = useOperatingHours();

  useEffect(() => {
    if (facilityId) {
      loadByFacility(facilityId);
    } else {
      clear();
    }
  }, [facilityId, loadByFacility, clear]);

  // Only return schedule if it matches the requested facility
  const schedule =
    weeklySchedule?.facilityId === facilityId ? weeklySchedule : null;

  return { weeklySchedule: schedule, loading, error };
}

/**
 * Hook to auto-load special hours by facility ID on mount
 */
export function useSpecialHoursByFacility(
  facilityId: string | undefined,
  params?: QuerySpecialHoursParams,
) {
  const { loadSpecialHours, specialHours, specialHoursTotal, loadingSpecialHours, error } =
    useOperatingHours();

  useEffect(() => {
    if (facilityId) {
      loadSpecialHours(facilityId, params);
    }
  }, [
    facilityId,
    loadSpecialHours,
    params?.startDate,
    params?.endDate,
    params?.isClosed,
    params?.includePast,
  ]);

  return {
    specialHours,
    total: specialHoursTotal,
    loading: loadingSpecialHours,
    error,
  };
}

/**
 * Hook for operating hours form operations (bulk update)
 */
export function useOperatingHoursForm(facilityId: string) {
  const { bulkUpdate, createDefaults, updating, creatingDefaults, error, clearError } =
    useOperatingHours();

  const isSubmitting = updating || creatingDefaults;

  const handleSubmit = useCallback(
    async (data: BulkUpdateOperatingHoursRequest) => {
      return bulkUpdate(facilityId, data);
    },
    [facilityId, bulkUpdate],
  );

  const handleCreateDefaults = useCallback(async () => {
    return createDefaults(facilityId);
  }, [facilityId, createDefaults]);

  return {
    submit: handleSubmit,
    createDefaults: handleCreateDefaults,
    isSubmitting,
    isCreatingDefaults: creatingDefaults,
    error,
    clearError,
  };
}

/**
 * Hook for special hours form operations (create/update/delete)
 */
export function useSpecialHoursForm() {
  const {
    createSpecialHours,
    updateSpecialHours,
    deleteSpecialHours,
    creatingSpecialHours,
    updatingSpecialHours,
    deletingSpecialHours,
    error,
    clearError,
  } = useOperatingHours();

  const isSubmitting = creatingSpecialHours || updatingSpecialHours;
  const isDeleting = deletingSpecialHours;

  const handleSubmit = useCallback(
    async (
      data: CreateSpecialHoursRequest | (UpdateSpecialHoursRequest & { id: string }),
    ): Promise<SpecialHours> => {
      if ('id' in data && data.id) {
        const { id, ...updateData } = data;
        return updateSpecialHours(id, updateData);
      }
      return createSpecialHours(data as CreateSpecialHoursRequest);
    },
    [createSpecialHours, updateSpecialHours],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      return deleteSpecialHours(id);
    },
    [deleteSpecialHours],
  );

  return {
    submit: handleSubmit,
    remove: handleDelete,
    isSubmitting,
    isDeleting,
    error,
    clearError,
  };
}

/**
 * Hook for managing a single day's operating hours
 */
export function useDayOperatingHours(dayId: string | undefined) {
  const { weeklySchedule, update, updating, error } = useOperatingHours();

  const dayHours = dayId
    ? weeklySchedule?.days.find((d) => d.id === dayId) ?? null
    : null;

  const handleUpdate = useCallback(
    async (data: UpdateOperatingHoursRequest) => {
      if (!dayId) throw new Error('Day ID is required');
      return update(dayId, data);
    },
    [dayId, update],
  );

  return {
    dayHours,
    update: handleUpdate,
    isUpdating: updating,
    error,
  };
}
