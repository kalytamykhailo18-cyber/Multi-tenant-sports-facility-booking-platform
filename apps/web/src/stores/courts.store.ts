// Courts Store
// Zustand store for court state management

import { create } from 'zustand';
import {
  courtsApi,
  type Court,
  type QueryCourtParams,
  type CreateCourtRequest,
  type UpdateCourtRequest,
  type CourtStatus,
  type ReorderCourtsRequest,
} from '@/lib/courts-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CourtsState {
  // Data
  courts: Court[];
  selectedCourt: Court | null;
  pagination: PaginationState;

  // Loading states
  loading: boolean;
  loadingCourt: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  reordering: boolean;

  // Error state
  error: string | null;

  // Actions
  loadCourts: (params?: QueryCourtParams) => Promise<void>;
  loadCourtsByFacility: (facilityId: string) => Promise<void>;
  loadCourt: (id: string) => Promise<void>;
  create: (data: CreateCourtRequest) => Promise<Court>;
  update: (id: string, data: UpdateCourtRequest) => Promise<Court>;
  updateStatus: (id: string, status: CourtStatus) => Promise<Court>;
  reorder: (data: ReorderCourtsRequest) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setSelectedCourt: (court: Court | null) => void;
  clearError: () => void;
  clearCourts: () => void;

  // Socket event handlers
  handleCourtCreated: (court: Court) => void;
  handleCourtUpdated: (court: Court) => void;
  handleCourtDeleted: (courtId: string) => void;
  handleCourtsReordered: (facilityId: string, courtIds: string[]) => void;
}

export const useCourtsStore = create<CourtsState>((set, get) => ({
  // Initial state
  courts: [],
  selectedCourt: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  loading: false,
  loadingCourt: false,
  creating: false,
  updating: false,
  deleting: false,
  reordering: false,
  error: null,

  // Actions
  loadCourts: async (params?: QueryCourtParams) => {
    set({ loading: true, error: null });
    try {
      const response = await courtsApi.list(params);
      set({
        courts: response.items,
        pagination: {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar canchas',
        loading: false,
      });
    }
  },

  loadCourtsByFacility: async (facilityId: string) => {
    set({ loading: true, error: null });
    try {
      const courts = await courtsApi.getByFacility(facilityId);
      set({
        courts,
        pagination: {
          total: courts.length,
          page: 1,
          limit: courts.length,
          totalPages: 1,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar canchas',
        loading: false,
      });
    }
  },

  loadCourt: async (id: string) => {
    set({ loadingCourt: true, error: null });
    try {
      const court = await courtsApi.getById(id);
      set({ selectedCourt: court, loadingCourt: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar cancha',
        loadingCourt: false,
      });
    }
  },

  create: async (data: CreateCourtRequest) => {
    set({ creating: true, error: null });
    try {
      const court = await courtsApi.create(data);
      set((state) => ({
        courts: [...state.courts, court].sort((a, b) => a.displayOrder - b.displayOrder),
        creating: false,
      }));
      return court;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear cancha',
        creating: false,
      });
      throw error;
    }
  },

  update: async (id: string, data: UpdateCourtRequest) => {
    set({ updating: true, error: null });
    try {
      const court = await courtsApi.update(id, data);
      set((state) => ({
        courts: state.courts.map((c) => (c.id === id ? court : c)),
        selectedCourt: state.selectedCourt?.id === id ? court : state.selectedCourt,
        updating: false,
      }));
      return court;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar cancha',
        updating: false,
      });
      throw error;
    }
  },

  updateStatus: async (id: string, status: CourtStatus) => {
    set({ updating: true, error: null });
    try {
      const court = await courtsApi.updateStatus(id, status);
      set((state) => ({
        courts: state.courts.map((c) => (c.id === id ? court : c)),
        selectedCourt: state.selectedCourt?.id === id ? court : state.selectedCourt,
        updating: false,
      }));
      return court;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar estado',
        updating: false,
      });
      throw error;
    }
  },

  reorder: async (data: ReorderCourtsRequest) => {
    set({ reordering: true, error: null });
    try {
      const courts = await courtsApi.reorder(data);
      set({
        courts,
        reordering: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al reordenar canchas',
        reordering: false,
      });
      throw error;
    }
  },

  remove: async (id: string) => {
    set({ deleting: true, error: null });
    try {
      await courtsApi.delete(id);
      set((state) => ({
        courts: state.courts.filter((c) => c.id !== id),
        selectedCourt: state.selectedCourt?.id === id ? null : state.selectedCourt,
        deleting: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar cancha',
        deleting: false,
      });
      throw error;
    }
  },

  setSelectedCourt: (court: Court | null) => {
    set({ selectedCourt: court });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCourts: () => {
    set({
      courts: [],
      selectedCourt: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    });
  },

  // Socket event handlers for real-time updates
  handleCourtCreated: (court: Court) => {
    set((state) => {
      // Only add if not already in the list and belongs to current facility view
      const exists = state.courts.some((c) => c.id === court.id);
      if (exists) return state;

      return {
        courts: [...state.courts, court].sort((a, b) => a.displayOrder - b.displayOrder),
      };
    });
  },

  handleCourtUpdated: (court: Court) => {
    set((state) => ({
      courts: state.courts.map((c) => (c.id === court.id ? court : c)),
      selectedCourt: state.selectedCourt?.id === court.id ? court : state.selectedCourt,
    }));
  },

  handleCourtDeleted: (courtId: string) => {
    set((state) => ({
      courts: state.courts.filter((c) => c.id !== courtId),
      selectedCourt: state.selectedCourt?.id === courtId ? null : state.selectedCourt,
    }));
  },

  handleCourtsReordered: (facilityId: string, courtIds: string[]) => {
    set((state) => {
      // Reorder courts based on the new order
      const reorderedCourts = state.courts
        .filter((c) => c.facilityId === facilityId)
        .sort((a, b) => {
          const indexA = courtIds.indexOf(a.id);
          const indexB = courtIds.indexOf(b.id);
          return indexA - indexB;
        })
        .map((court, index) => ({ ...court, displayOrder: index }));

      // Merge with courts from other facilities
      const otherCourts = state.courts.filter((c) => c.facilityId !== facilityId);

      return {
        courts: [...otherCourts, ...reorderedCourts],
      };
    });
  },
}));
