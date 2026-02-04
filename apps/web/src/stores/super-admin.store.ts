// Super Admin Store
// Zustand store for Super Admin dashboard and facility management

import { create } from 'zustand';
import {
  superAdminApi,
  type SuperAdminDashboard,
  type FacilitySummary,
  type FacilityQueryParams,
} from '@/lib/super-admin-api';

interface SuperAdminState {
  // Dashboard data
  dashboard: SuperAdminDashboard | null;
  loadingDashboard: boolean;

  // Facilities data
  facilities: FacilitySummary[];
  facilitiesTotal: number;
  facilitiesPage: number;
  facilitiesLimit: number;
  facilitiesTotalPages: number;
  loadingFacilities: boolean;

  // Selected facility
  selectedFacility: FacilitySummary | null;
  loadingFacilityDetails: boolean;

  // Error state
  error: string | null;

  // Dashboard actions
  loadDashboard: () => Promise<void>;

  // Facilities actions
  loadFacilities: (params?: FacilityQueryParams) => Promise<void>;
  loadFacilityDetails: (id: string) => Promise<void>;
  setSelectedFacility: (facility: FacilitySummary | null) => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  dashboard: null,
  loadingDashboard: false,
  facilities: [],
  facilitiesTotal: 0,
  facilitiesPage: 1,
  facilitiesLimit: 10,
  facilitiesTotalPages: 0,
  loadingFacilities: false,
  selectedFacility: null,
  loadingFacilityDetails: false,
  error: null,
};

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  ...initialState,

  // Dashboard actions
  loadDashboard: async () => {
    set({ loadingDashboard: true, error: null });
    try {
      const dashboard = await superAdminApi.getDashboard();
      set({ dashboard, loadingDashboard: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading dashboard',
        loadingDashboard: false,
      });
    }
  },

  // Facilities actions
  loadFacilities: async (params?: FacilityQueryParams) => {
    set({ loadingFacilities: true, error: null });
    try {
      const response = await superAdminApi.getFacilities(params);
      set({
        facilities: response.items,
        facilitiesTotal: response.total,
        facilitiesPage: response.page,
        facilitiesLimit: response.limit,
        facilitiesTotalPages: response.totalPages,
        loadingFacilities: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading facilities',
        loadingFacilities: false,
      });
    }
  },

  loadFacilityDetails: async (id: string) => {
    set({ loadingFacilityDetails: true, error: null });
    try {
      const facility = await superAdminApi.getFacilityDetails(id);
      set({ selectedFacility: facility, loadingFacilityDetails: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading facility details',
        loadingFacilityDetails: false,
      });
    }
  },

  setSelectedFacility: (facility: FacilitySummary | null) => {
    set({ selectedFacility: facility });
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
