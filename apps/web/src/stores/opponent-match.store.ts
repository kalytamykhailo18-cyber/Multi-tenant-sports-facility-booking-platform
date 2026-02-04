// Opponent Match Store
// Zustand state management for opponent matching

import { create } from 'zustand';
import {
  opponentMatchApi,
  OpponentMatch,
  CreateOpponentMatchDto,
  JoinOpponentMatchDto,
  GetOpponentMatchesQuery,
} from '@/lib/opponent-match-api';

interface OpponentMatchState {
  // Data
  matches: OpponentMatch[];
  selectedMatch: OpponentMatch | null;

  // UI State
  loading: boolean;
  createLoading: boolean;
  joinLoading: boolean;
  leaveLoading: boolean;
  cancelLoading: boolean;
  error: string | null;

  // Actions
  fetchMatches: (query?: GetOpponentMatchesQuery) => Promise<void>;
  fetchMatchById: (id: string) => Promise<void>;
  createMatch: (data: CreateOpponentMatchDto) => Promise<void>;
  joinMatch: (id: string, data?: JoinOpponentMatchDto) => Promise<void>;
  leaveMatch: (id: string) => Promise<void>;
  cancelMatch: (id: string) => Promise<void>;

  // Real-time handlers (called by socket events)
  addMatch: (match: OpponentMatch) => void;
  updateMatch: (match: OpponentMatch) => void;
  removeMatch: (id: string) => void;

  // Selectors
  setSelectedMatch: (match: OpponentMatch | null) => void;
  clearError: () => void;
}

export const useOpponentMatchStore = create<OpponentMatchState>((set, get) => ({
  // Initial state
  matches: [],
  selectedMatch: null,
  loading: false,
  createLoading: false,
  joinLoading: false,
  leaveLoading: false,
  cancelLoading: false,
  error: null,

  // Fetch all matches
  fetchMatches: async (query?: GetOpponentMatchesQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await opponentMatchApi.getAll(query);
      set({ matches: response.matches, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar las búsquedas',
        loading: false,
      });
    }
  },

  // Fetch match by ID
  fetchMatchById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const match = await opponentMatchApi.getById(id);
      set({ selectedMatch: match, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar la búsqueda',
        loading: false,
      });
    }
  },

  // Create new match
  createMatch: async (data: CreateOpponentMatchDto) => {
    set({ createLoading: true, error: null });
    try {
      const match = await opponentMatchApi.create(data);
      // Requester updates from HTTP response
      set((state) => ({
        matches: [match, ...state.matches],
        createLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear la búsqueda',
        createLoading: false,
      });
      throw error;
    }
  },

  // Join match
  joinMatch: async (id: string, data?: JoinOpponentMatchDto) => {
    set({ joinLoading: true, error: null });
    try {
      const updatedMatch = await opponentMatchApi.join(id, data);
      // Requester updates from HTTP response
      set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? updatedMatch : m)),
        selectedMatch: state.selectedMatch?.id === id ? updatedMatch : state.selectedMatch,
        joinLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al unirse a la búsqueda',
        joinLoading: false,
      });
      throw error;
    }
  },

  // Leave match
  leaveMatch: async (id: string) => {
    set({ leaveLoading: true, error: null });
    try {
      const updatedMatch = await opponentMatchApi.leave(id);
      // Requester updates from HTTP response
      set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? updatedMatch : m)),
        selectedMatch: state.selectedMatch?.id === id ? updatedMatch : state.selectedMatch,
        leaveLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al salir de la búsqueda',
        leaveLoading: false,
      });
      throw error;
    }
  },

  // Cancel match
  cancelMatch: async (id: string) => {
    set({ cancelLoading: true, error: null });
    try {
      const cancelledMatch = await opponentMatchApi.cancel(id);
      // Requester updates from HTTP response
      set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? cancelledMatch : m)),
        selectedMatch: state.selectedMatch?.id === id ? cancelledMatch : state.selectedMatch,
        cancelLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cancelar la búsqueda',
        cancelLoading: false,
      });
      throw error;
    }
  },

  // Real-time: Add match (from socket)
  addMatch: (match: OpponentMatch) => {
    set((state) => ({
      matches: [match, ...state.matches],
    }));
  },

  // Real-time: Update match (from socket)
  updateMatch: (match: OpponentMatch) => {
    set((state) => ({
      matches: state.matches.map((m) => (m.id === match.id ? match : m)),
      selectedMatch: state.selectedMatch?.id === match.id ? match : state.selectedMatch,
    }));
  },

  // Real-time: Remove match (from socket)
  removeMatch: (id: string) => {
    set((state) => ({
      matches: state.matches.filter((m) => m.id !== id),
      selectedMatch: state.selectedMatch?.id === id ? null : state.selectedMatch,
    }));
  },

  // Set selected match
  setSelectedMatch: (match: OpponentMatch | null) => {
    set({ selectedMatch: match });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
