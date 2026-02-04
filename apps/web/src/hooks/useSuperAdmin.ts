// Super Admin Hook
// Custom hook for Super Admin state management

'use client';

import { useCallback, useEffect } from 'react';
import { useSuperAdminStore } from '@/stores/super-admin.store';
import type { FacilityQueryParams } from '@/lib/super-admin-api';

/**
 * Main hook for Super Admin data
 * Provides all Super Admin-related state and actions
 */
export function useSuperAdmin() {
  const {
    dashboard,
    loadingDashboard,
    facilities,
    facilitiesTotal,
    facilitiesPage,
    facilitiesLimit,
    facilitiesTotalPages,
    loadingFacilities,
    selectedFacility,
    loadingFacilityDetails,
    error,
    loadDashboard,
    loadFacilities,
    loadFacilityDetails,
    setSelectedFacility,
    clearError,
    reset,
  } = useSuperAdminStore();

  // Memoized callbacks for stable references
  const handleLoadDashboard = useCallback(() => loadDashboard(), [loadDashboard]);

  const handleLoadFacilities = useCallback(
    (params?: FacilityQueryParams) => loadFacilities(params),
    [loadFacilities],
  );

  const handleLoadFacilityDetails = useCallback(
    (id: string) => loadFacilityDetails(id),
    [loadFacilityDetails],
  );

  const handleSetSelectedFacility = useCallback(
    (facility: typeof selectedFacility) => setSelectedFacility(facility),
    [setSelectedFacility],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  const handleReset = useCallback(() => reset(), [reset]);

  // Computed values
  const isLoading = loadingDashboard || loadingFacilities || loadingFacilityDetails;
  const hasFacilities = facilitiesTotal > 0;
  const hasUpcomingDue = (dashboard?.facilitiesWithUpcomingDue.length || 0) > 0;

  return {
    // Dashboard state
    dashboard,
    loadingDashboard,

    // Facilities state
    facilities,
    facilitiesTotal,
    facilitiesPage,
    facilitiesLimit,
    facilitiesTotalPages,
    loadingFacilities,

    // Selected facility state
    selectedFacility,
    loadingFacilityDetails,

    // Error state
    error,

    // Computed
    isLoading,
    hasFacilities,
    hasUpcomingDue,

    // Actions
    loadDashboard: handleLoadDashboard,
    loadFacilities: handleLoadFacilities,
    loadFacilityDetails: handleLoadFacilityDetails,
    setSelectedFacility: handleSetSelectedFacility,
    clearError: handleClearError,
    reset: handleReset,
  };
}

/**
 * Hook to auto-load dashboard data on mount
 */
export function useSuperAdminDashboardLoader() {
  const { dashboard, loadingDashboard, error, loadDashboard } = useSuperAdmin();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    isLoading: loadingDashboard,
    error,
  };
}

/**
 * Hook to auto-load facilities with params
 */
export function useSuperAdminFacilitiesLoader(params?: FacilityQueryParams) {
  const { facilities, facilitiesTotal, facilitiesTotalPages, loadingFacilities, error, loadFacilities } = useSuperAdmin();

  useEffect(() => {
    loadFacilities(params);
  }, [loadFacilities, params?.page, params?.limit, params?.search, params?.status, params?.subscriptionStatus, params?.sortBy, params?.sortOrder]);

  return {
    facilities,
    total: facilitiesTotal,
    totalPages: facilitiesTotalPages,
    isLoading: loadingFacilities,
    error,
  };
}
