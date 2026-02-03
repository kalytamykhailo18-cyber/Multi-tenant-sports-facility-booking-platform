// Dashboard Hook
// Custom hook for dashboard state management

'use client';

import { useCallback, useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboard.store';
import type { DashboardQueryParams, UpcomingQueryParams } from '@/lib/dashboard-api';

/**
 * Main hook for dashboard data
 * Provides all dashboard-related state and actions
 */
export function useDashboard() {
  const {
    stats,
    alerts,
    alertsTotal,
    upcoming,
    upcomingTotal,
    loadingStats,
    loadingAlerts,
    loadingUpcoming,
    error,
    loadStats,
    loadAlerts,
    loadUpcoming,
    loadAll,
    clearError,
    reset,
  } = useDashboardStore();

  // Memoized callbacks for stable references
  const handleLoadStats = useCallback(
    (params?: DashboardQueryParams) => loadStats(params),
    [loadStats],
  );

  const handleLoadAlerts = useCallback(
    (params?: DashboardQueryParams) => loadAlerts(params),
    [loadAlerts],
  );

  const handleLoadUpcoming = useCallback(
    (params?: UpcomingQueryParams) => loadUpcoming(params),
    [loadUpcoming],
  );

  const handleLoadAll = useCallback(
    (params?: DashboardQueryParams) => loadAll(params),
    [loadAll],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  const handleReset = useCallback(() => reset(), [reset]);

  // Computed values
  const isLoading = loadingStats || loadingAlerts || loadingUpcoming;
  const hasAlerts = alertsTotal > 0;
  const hasUpcoming = upcomingTotal > 0;

  // Get alert count by priority
  const urgentAlertsCount = alerts.filter(a => a.priority === 'URGENT').length;
  const highAlertsCount = alerts.filter(a => a.priority === 'HIGH').length;

  return {
    // State
    stats,
    alerts,
    alertsTotal,
    upcoming,
    upcomingTotal,
    loadingStats,
    loadingAlerts,
    loadingUpcoming,
    isLoading,
    error,

    // Computed
    hasAlerts,
    hasUpcoming,
    urgentAlertsCount,
    highAlertsCount,

    // Actions
    loadStats: handleLoadStats,
    loadAlerts: handleLoadAlerts,
    loadUpcoming: handleLoadUpcoming,
    loadAll: handleLoadAll,
    clearError: handleClearError,
    reset: handleReset,
  };
}

/**
 * Hook to auto-load all dashboard data on mount
 */
export function useDashboardLoader(params?: DashboardQueryParams) {
  const {
    stats,
    alerts,
    upcoming,
    isLoading,
    error,
    loadAll,
  } = useDashboard();

  useEffect(() => {
    loadAll(params);
  }, [loadAll, params?.facilityId]);

  return {
    stats,
    alerts,
    upcoming,
    isLoading,
    error,
  };
}

/**
 * Hook to auto-refresh dashboard data periodically
 */
export function useDashboardAutoRefresh(params?: DashboardQueryParams, intervalMs: number = 60000) {
  const { loadAll } = useDashboard();

  useEffect(() => {
    // Initial load
    loadAll(params);

    // Set up interval for refresh
    const interval = setInterval(() => {
      loadAll(params);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [loadAll, params?.facilityId, intervalMs]);
}
