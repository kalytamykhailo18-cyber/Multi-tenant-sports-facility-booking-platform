// Operating Hours Store
// Zustand store for operating hours state management

import { create } from 'zustand';
import {
  operatingHoursApi,
  type WeeklySchedule,
  type OperatingHours,
  type SpecialHours,
  type UpdateOperatingHoursRequest,
  type BulkUpdateOperatingHoursRequest,
  type CreateSpecialHoursRequest,
  type UpdateSpecialHoursRequest,
  type QuerySpecialHoursParams,
} from '@/lib/operating-hours-api';

interface OperatingHoursState {
  // Data
  weeklySchedule: WeeklySchedule | null;
  specialHours: SpecialHours[];
  specialHoursTotal: number;

  // Loading states
  loading: boolean;
  loadingSpecialHours: boolean;
  updating: boolean;
  creatingDefaults: boolean;
  creatingSpecialHours: boolean;
  updatingSpecialHours: boolean;
  deletingSpecialHours: boolean;

  // Error state
  error: string | null;

  // Actions - Operating Hours
  loadByFacility: (facilityId: string) => Promise<void>;
  update: (id: string, data: UpdateOperatingHoursRequest) => Promise<OperatingHours>;
  bulkUpdate: (facilityId: string, data: BulkUpdateOperatingHoursRequest) => Promise<WeeklySchedule>;
  createDefaults: (facilityId: string) => Promise<OperatingHours[]>;

  // Actions - Special Hours
  loadSpecialHours: (facilityId: string, params?: QuerySpecialHoursParams) => Promise<void>;
  createSpecialHours: (data: CreateSpecialHoursRequest) => Promise<SpecialHours>;
  updateSpecialHours: (id: string, data: UpdateSpecialHoursRequest) => Promise<SpecialHours>;
  deleteSpecialHours: (id: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  clear: () => void;

  // Socket event handlers
  handleOperatingHoursUpdated: (schedule: WeeklySchedule) => void;
  handleSpecialHoursCreated: (specialHours: SpecialHours) => void;
  handleSpecialHoursUpdated: (specialHours: SpecialHours) => void;
  handleSpecialHoursDeleted: (specialHoursId: string) => void;
}

export const useOperatingHoursStore = create<OperatingHoursState>((set, get) => ({
  // Initial state
  weeklySchedule: null,
  specialHours: [],
  specialHoursTotal: 0,
  loading: false,
  loadingSpecialHours: false,
  updating: false,
  creatingDefaults: false,
  creatingSpecialHours: false,
  updatingSpecialHours: false,
  deletingSpecialHours: false,
  error: null,

  // Actions - Operating Hours
  loadByFacility: async (facilityId: string) => {
    set({ loading: true, error: null });
    try {
      const schedule = await operatingHoursApi.getByFacility(facilityId);
      set({
        weeklySchedule: schedule,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar horarios de operación',
        loading: false,
      });
    }
  },

  update: async (id: string, data: UpdateOperatingHoursRequest) => {
    set({ updating: true, error: null });
    try {
      const updatedHours = await operatingHoursApi.update(id, data);
      // Update the day in the weekly schedule
      set((state) => {
        if (!state.weeklySchedule) return { updating: false };
        return {
          weeklySchedule: {
            ...state.weeklySchedule,
            days: state.weeklySchedule.days.map((day) =>
              day.id === id ? updatedHours : day
            ),
          },
          updating: false,
        };
      });
      return updatedHours;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar horarios',
        updating: false,
      });
      throw error;
    }
  },

  bulkUpdate: async (facilityId: string, data: BulkUpdateOperatingHoursRequest) => {
    set({ updating: true, error: null });
    try {
      const schedule = await operatingHoursApi.bulkUpdate(facilityId, data);
      set({
        weeklySchedule: schedule,
        updating: false,
      });
      return schedule;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar horarios semanales',
        updating: false,
      });
      throw error;
    }
  },

  createDefaults: async (facilityId: string) => {
    set({ creatingDefaults: true, error: null });
    try {
      const hours = await operatingHoursApi.createDefaults(facilityId);
      // Reload the schedule to get the full weekly structure
      await get().loadByFacility(facilityId);
      set({ creatingDefaults: false });
      return hours;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear horarios predeterminados',
        creatingDefaults: false,
      });
      throw error;
    }
  },

  // Actions - Special Hours
  loadSpecialHours: async (facilityId: string, params?: QuerySpecialHoursParams) => {
    set({ loadingSpecialHours: true, error: null });
    try {
      const response = await operatingHoursApi.getSpecialHours(facilityId, params);
      set({
        specialHours: response.items,
        specialHoursTotal: response.total,
        loadingSpecialHours: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar horarios especiales',
        loadingSpecialHours: false,
      });
    }
  },

  createSpecialHours: async (data: CreateSpecialHoursRequest) => {
    set({ creatingSpecialHours: true, error: null });
    try {
      const specialHours = await operatingHoursApi.createSpecialHours(data);
      set((state) => ({
        specialHours: [...state.specialHours, specialHours].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        specialHoursTotal: state.specialHoursTotal + 1,
        creatingSpecialHours: false,
      }));
      return specialHours;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear horario especial',
        creatingSpecialHours: false,
      });
      throw error;
    }
  },

  updateSpecialHours: async (id: string, data: UpdateSpecialHoursRequest) => {
    set({ updatingSpecialHours: true, error: null });
    try {
      const specialHours = await operatingHoursApi.updateSpecialHours(id, data);
      set((state) => ({
        specialHours: state.specialHours
          .map((sh) => (sh.id === id ? specialHours : sh))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        updatingSpecialHours: false,
      }));
      return specialHours;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar horario especial',
        updatingSpecialHours: false,
      });
      throw error;
    }
  },

  deleteSpecialHours: async (id: string) => {
    set({ deletingSpecialHours: true, error: null });
    try {
      await operatingHoursApi.deleteSpecialHours(id);
      set((state) => ({
        specialHours: state.specialHours.filter((sh) => sh.id !== id),
        specialHoursTotal: state.specialHoursTotal - 1,
        deletingSpecialHours: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar horario especial',
        deletingSpecialHours: false,
      });
      throw error;
    }
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  clear: () => {
    set({
      weeklySchedule: null,
      specialHours: [],
      specialHoursTotal: 0,
      error: null,
    });
  },

  // Socket event handlers for real-time updates
  handleOperatingHoursUpdated: (schedule: WeeklySchedule) => {
    const state = get();
    // Only update if this is for the currently loaded facility
    if (state.weeklySchedule?.facilityId === schedule.facilityId) {
      set({ weeklySchedule: schedule });
    }
  },

  handleSpecialHoursCreated: (specialHours: SpecialHours) => {
    set((state) => {
      // Only add if for the current facility and not already in the list
      if (
        state.weeklySchedule?.facilityId !== specialHours.facilityId ||
        state.specialHours.some((sh) => sh.id === specialHours.id)
      ) {
        return state;
      }
      return {
        specialHours: [...state.specialHours, specialHours].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        specialHoursTotal: state.specialHoursTotal + 1,
      };
    });
  },

  handleSpecialHoursUpdated: (specialHours: SpecialHours) => {
    set((state) => ({
      specialHours: state.specialHours
        .map((sh) => (sh.id === specialHours.id ? specialHours : sh))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));
  },

  handleSpecialHoursDeleted: (specialHoursId: string) => {
    set((state) => ({
      specialHours: state.specialHours.filter((sh) => sh.id !== specialHoursId),
      specialHoursTotal: Math.max(0, state.specialHoursTotal - 1),
    }));
  },
}));
