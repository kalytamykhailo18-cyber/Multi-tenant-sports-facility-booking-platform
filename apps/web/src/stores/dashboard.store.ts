// Dashboard Store
// Zustand store for dashboard state management

import { create } from 'zustand';
import {
  dashboardApi,
  type DashboardStats,
  type DashboardAlert,
  type UpcomingBooking,
  type DashboardQueryParams,
  type UpcomingQueryParams,
} from '@/lib/dashboard-api';

interface DashboardState {
  // Data
  stats: DashboardStats | null;
  alerts: DashboardAlert[];
  alertsTotal: number;
  upcoming: UpcomingBooking[];
  upcomingTotal: number;

  // Loading states
  loadingStats: boolean;
  loadingAlerts: boolean;
  loadingUpcoming: boolean;

  // Error state
  error: string | null;

  // Actions
  loadStats: (params?: DashboardQueryParams) => Promise<void>;
  loadAlerts: (params?: DashboardQueryParams) => Promise<void>;
  loadUpcoming: (params?: UpcomingQueryParams) => Promise<void>;
  loadAll: (params?: DashboardQueryParams) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  stats: null,
  alerts: [],
  alertsTotal: 0,
  upcoming: [],
  upcomingTotal: 0,
  loadingStats: false,
  loadingAlerts: false,
  loadingUpcoming: false,
  error: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,

  // Actions
  loadStats: async (params?: DashboardQueryParams) => {
    set({ loadingStats: true, error: null });
    try {
      const stats = await dashboardApi.getStats(params);
      set({ stats, loadingStats: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar estadísticas',
        loadingStats: false,
      });
    }
  },

  loadAlerts: async (params?: DashboardQueryParams) => {
    set({ loadingAlerts: true, error: null });
    try {
      const response = await dashboardApi.getAlerts(params);
      set({
        alerts: response.alerts,
        alertsTotal: response.total,
        loadingAlerts: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar alertas',
        loadingAlerts: false,
      });
    }
  },

  loadUpcoming: async (params?: UpcomingQueryParams) => {
    set({ loadingUpcoming: true, error: null });
    try {
      const response = await dashboardApi.getUpcoming(params);
      set({
        upcoming: response.bookings,
        upcomingTotal: response.total,
        loadingUpcoming: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar próximas reservas',
        loadingUpcoming: false,
      });
    }
  },

  loadAll: async (params?: DashboardQueryParams) => {
    set({ loadingStats: true, loadingAlerts: true, loadingUpcoming: true, error: null });
    try {
      const [stats, alertsResponse, upcomingResponse] = await Promise.all([
        dashboardApi.getStats(params),
        dashboardApi.getAlerts(params),
        dashboardApi.getUpcoming({ ...params, limit: 5 }),
      ]);
      set({
        stats,
        alerts: alertsResponse.alerts,
        alertsTotal: alertsResponse.total,
        upcoming: upcomingResponse.bookings,
        upcomingTotal: upcomingResponse.total,
        loadingStats: false,
        loadingAlerts: false,
        loadingUpcoming: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar dashboard',
        loadingStats: false,
        loadingAlerts: false,
        loadingUpcoming: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
