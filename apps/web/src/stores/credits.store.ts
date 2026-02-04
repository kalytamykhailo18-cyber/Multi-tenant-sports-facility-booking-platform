// Credits Store
// Zustand store for customer credit state management

import { create } from 'zustand';
import {
  creditsApi,
  type Credit,
  type CreditReason,
  type CustomerCreditBalance,
  type ApplyCreditResult,
  type CreateCreditRequest,
  type UseCreditRequest,
  type QueryCreditParams,
} from '@/lib/credits-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FiltersState {
  customerId: string | null;
  reason: CreditReason | null;
  isActive: boolean | null;
  hasBalance: boolean | null;
  includeExpired: boolean;
  sortBy: QueryCreditParams['sortBy'];
  sortOrder: 'asc' | 'desc';
}

interface CreditsState {
  // Data
  credits: Credit[];
  selectedCredit: Credit | null;
  customerBalances: Map<string, CustomerCreditBalance>;
  pagination: PaginationState;
  filters: FiltersState;

  // Loading states
  loading: boolean;
  loadingCredit: boolean;
  loadingBalance: boolean;
  creating: boolean;
  usingCredit: boolean;
  deactivating: boolean;

  // Error state
  error: string | null;

  // Actions
  loadCredits: (params?: QueryCreditParams) => Promise<void>;
  loadCredit: (id: string) => Promise<void>;
  loadCustomerBalance: (customerId: string) => Promise<CustomerCreditBalance>;
  create: (data: CreateCreditRequest) => Promise<Credit>;
  useCredits: (data: UseCreditRequest) => Promise<ApplyCreditResult>;
  deactivate: (id: string, reason?: string) => Promise<Credit>;
  loadBookingCredits: (bookingId: string) => Promise<Credit[]>;
  setFilters: (filters: Partial<FiltersState>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSelectedCredit: (credit: Credit | null) => void;
  clearError: () => void;
  clearCredits: () => void;

  // Socket event handlers
  handleCreditCreated: (credit: Credit) => void;
  handleCreditUpdated: (credit: Credit) => void;
  handleCreditUsed: (data: { customerId: string; bookingId: string; amountApplied: number }) => void;
}

const defaultFilters: FiltersState = {
  customerId: null,
  reason: null,
  isActive: true,
  hasBalance: null,
  includeExpired: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useCreditsStore = create<CreditsState>((set, get) => ({
  // Initial state
  credits: [],
  selectedCredit: null,
  customerBalances: new Map(),
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
  filters: { ...defaultFilters },
  loading: false,
  loadingCredit: false,
  loadingBalance: false,
  creating: false,
  usingCredit: false,
  deactivating: false,
  error: null,

  // Actions
  loadCredits: async (params?: QueryCreditParams) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams: QueryCreditParams = {
        page: pagination.page,
        limit: pagination.limit,
        customerId: filters.customerId || undefined,
        reason: filters.reason || undefined,
        isActive: filters.isActive ?? undefined,
        hasBalance: filters.hasBalance ?? undefined,
        includeExpired: filters.includeExpired || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...params,
      };

      const response = await creditsApi.list(queryParams);
      set({
        credits: response.items,
        pagination: {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: Math.ceil(response.total / response.limit),
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar créditos',
        loading: false,
      });
    }
  },

  loadCredit: async (id: string) => {
    set({ loadingCredit: true, error: null });
    try {
      const credit = await creditsApi.getById(id);
      set({ selectedCredit: credit, loadingCredit: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar crédito',
        loadingCredit: false,
      });
    }
  },

  loadCustomerBalance: async (customerId: string) => {
    set({ loadingBalance: true, error: null });
    try {
      const balance = await creditsApi.getCustomerBalance(customerId);
      set((state) => ({
        customerBalances: new Map(state.customerBalances).set(customerId, balance),
        loadingBalance: false,
      }));
      return balance;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar balance de crédito',
        loadingBalance: false,
      });
      throw error;
    }
  },

  create: async (data: CreateCreditRequest) => {
    set({ creating: true, error: null });
    try {
      const credit = await creditsApi.create(data);

      // Add to credits list
      set((state) => ({
        credits: [credit, ...state.credits],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
        creating: false,
      }));

      // Invalidate customer balance cache
      get().customerBalances.delete(data.customerId);

      return credit;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear crédito',
        creating: false,
      });
      throw error;
    }
  },

  useCredits: async (data: UseCreditRequest) => {
    set({ usingCredit: true, error: null });
    try {
      const result = await creditsApi.useCredits(data);

      // Reload credits to get updated amounts
      await get().loadCredits();

      // Invalidate customer balance cache
      get().customerBalances.delete(data.customerId);

      set({ usingCredit: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al usar crédito',
        usingCredit: false,
      });
      throw error;
    }
  },

  deactivate: async (id: string, reason?: string) => {
    set({ deactivating: true, error: null });
    try {
      const credit = await creditsApi.deactivate(id, reason);

      // Update credit in the list
      set((state) => ({
        credits: state.credits.map((c) => (c.id === id ? credit : c)),
        selectedCredit: state.selectedCredit?.id === id ? credit : state.selectedCredit,
        deactivating: false,
      }));

      // Invalidate customer balance cache
      get().customerBalances.delete(credit.customerId);

      return credit;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al desactivar crédito',
        deactivating: false,
      });
      throw error;
    }
  },

  loadBookingCredits: async (bookingId: string) => {
    try {
      return await creditsApi.getByBooking(bookingId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar créditos de la reserva',
      });
      throw error;
    }
  },

  setFilters: (filters: Partial<FiltersState>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  resetFilters: () => {
    set({
      filters: { ...defaultFilters },
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },

  setSelectedCredit: (credit: Credit | null) => {
    set({ selectedCredit: credit });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCredits: () => {
    set({
      credits: [],
      selectedCredit: null,
      customerBalances: new Map(),
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
      filters: { ...defaultFilters },
    });
  },

  // Socket event handlers
  handleCreditCreated: (credit: Credit) => {
    set((state) => {
      // Add to list if not already exists
      const exists = state.credits.some((c) => c.id === credit.id);
      if (exists) return state;

      // Invalidate customer balance cache
      state.customerBalances.delete(credit.customerId);

      return {
        credits: [credit, ...state.credits],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };
    });
  },

  handleCreditUpdated: (credit: Credit) => {
    set((state) => {
      // Invalidate customer balance cache
      state.customerBalances.delete(credit.customerId);

      return {
        credits: state.credits.map((c) => (c.id === credit.id ? credit : c)),
        selectedCredit: state.selectedCredit?.id === credit.id ? credit : state.selectedCredit,
      };
    });
  },

  handleCreditUsed: (data: { customerId: string; bookingId: string; amountApplied: number }) => {
    set((state) => {
      // Invalidate customer balance cache
      state.customerBalances.delete(data.customerId);
      return state;
    });

    // Reload credits to get updated amounts
    get().loadCredits();
  },
}));
