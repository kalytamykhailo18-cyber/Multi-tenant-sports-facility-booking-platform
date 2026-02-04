// Customers Store
// Zustand store for customer state management

import { create } from 'zustand';
import {
  customersApi,
  type CustomerSummary,
  type CustomerWithRelations,
  type CustomerDetails,
  type CustomerNote,
  type ReputationHistoryEntry,
  type QueryCustomerParams,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type BlockCustomerRequest,
  type UpdateReputationRequest,
  type AddCreditRequest,
  type AddNoteRequest,
  type ReputationLevel,
} from '@/lib/customers-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FiltersState {
  search: string;
  reputationLevel: ReputationLevel | null;
  isBlocked: boolean | null;
  hasCredit: boolean | null;
  sortBy: QueryCustomerParams['sortBy'];
  sortOrder: 'asc' | 'desc';
}

interface CustomersState {
  // Data
  customers: CustomerSummary[];
  selectedCustomer: CustomerWithRelations | null;
  pagination: PaginationState;
  filters: FiltersState;

  // Loading states
  loading: boolean;
  loadingCustomer: boolean;
  creating: boolean;
  updating: boolean;
  blocking: boolean;
  updatingReputation: boolean;
  addingCredit: boolean;
  addingNote: boolean;
  loadingNotes: boolean;
  loadingHistory: boolean;

  // Error state
  error: string | null;

  // Actions
  loadCustomers: (params?: QueryCustomerParams) => Promise<void>;
  loadCustomer: (id: string) => Promise<void>;
  findByPhone: (phone: string) => Promise<CustomerDetails | null>;
  create: (data: CreateCustomerRequest) => Promise<CustomerDetails>;
  update: (id: string, data: UpdateCustomerRequest) => Promise<CustomerDetails>;
  setBlocked: (id: string, data: BlockCustomerRequest) => Promise<CustomerDetails>;
  updateReputation: (id: string, data: UpdateReputationRequest) => Promise<CustomerDetails>;
  addCredit: (id: string, data: AddCreditRequest) => Promise<CustomerDetails>;
  addNote: (id: string, data: AddNoteRequest) => Promise<CustomerNote>;
  loadNotes: (id: string, limit?: number) => Promise<CustomerNote[]>;
  loadReputationHistory: (id: string, limit?: number) => Promise<ReputationHistoryEntry[]>;
  setFilters: (filters: Partial<FiltersState>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSelectedCustomer: (customer: CustomerWithRelations | null) => void;
  clearError: () => void;
  clearCustomers: () => void;

  // Socket event handlers
  handleCustomerCreated: (customer: CustomerSummary) => void;
  handleCustomerUpdated: (customer: CustomerSummary) => void;
  handleCustomerBlocked: (customerId: string, isBlocked: boolean) => void;
  handleReputationUpdated: (customerId: string, score: number, level: ReputationLevel) => void;
  handleCreditUpdated: (customerId: string, creditBalance: number) => void;
  handleNoteAdded: (customerId: string, note: CustomerNote) => void;
}

const defaultFilters: FiltersState = {
  search: '',
  reputationLevel: null,
  isBlocked: null,
  hasCredit: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  // Initial state
  customers: [],
  selectedCustomer: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: { ...defaultFilters },
  loading: false,
  loadingCustomer: false,
  creating: false,
  updating: false,
  blocking: false,
  updatingReputation: false,
  addingCredit: false,
  addingNote: false,
  loadingNotes: false,
  loadingHistory: false,
  error: null,

  // Actions
  loadCustomers: async (params?: QueryCustomerParams) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams: QueryCustomerParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        reputationLevel: filters.reputationLevel || undefined,
        isBlocked: filters.isBlocked ?? undefined,
        hasCredit: filters.hasCredit ?? undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...params,
      };

      const response = await customersApi.list(queryParams);
      set({
        customers: response.data,
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
        error: error instanceof Error ? error.message : 'Error al cargar clientes',
        loading: false,
      });
    }
  },

  loadCustomer: async (id: string) => {
    set({ loadingCustomer: true, error: null });
    try {
      const customer = await customersApi.getById(id);
      set({ selectedCustomer: customer, loadingCustomer: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar cliente',
        loadingCustomer: false,
      });
    }
  },

  findByPhone: async (phone: string) => {
    try {
      return await customersApi.getByPhone(phone);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al buscar cliente',
      });
      return null;
    }
  },

  create: async (data: CreateCustomerRequest) => {
    set({ creating: true, error: null });
    try {
      const customer = await customersApi.create(data);
      // Reload customers list to get updated data
      await get().loadCustomers();
      set({ creating: false });
      return customer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear cliente',
        creating: false,
      });
      throw error;
    }
  },

  update: async (id: string, data: UpdateCustomerRequest) => {
    set({ updating: true, error: null });
    try {
      const customer = await customersApi.update(id, data);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id
            ? {
                ...c,
                name: customer.name,
                email: customer.email,
                isBlocked: customer.isBlocked,
              }
            : c
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, ...customer }
            : state.selectedCustomer,
        updating: false,
      }));
      return customer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar cliente',
        updating: false,
      });
      throw error;
    }
  },

  setBlocked: async (id: string, data: BlockCustomerRequest) => {
    set({ blocking: true, error: null });
    try {
      const customer = await customersApi.setBlocked(id, data);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, isBlocked: customer.isBlocked } : c
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, ...customer }
            : state.selectedCustomer,
        blocking: false,
      }));
      return customer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al bloquear/desbloquear cliente',
        blocking: false,
      });
      throw error;
    }
  },

  updateReputation: async (id: string, data: UpdateReputationRequest) => {
    set({ updatingReputation: true, error: null });
    try {
      const customer = await customersApi.updateReputation(id, data);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id
            ? {
                ...c,
                reputationScore: customer.reputationScore,
                reputationLevel: customer.reputationLevel,
              }
            : c
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, ...customer }
            : state.selectedCustomer,
        updatingReputation: false,
      }));
      return customer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar reputación',
        updatingReputation: false,
      });
      throw error;
    }
  },

  addCredit: async (id: string, data: AddCreditRequest) => {
    set({ addingCredit: true, error: null });
    try {
      const customer = await customersApi.addCredit(id, data);
      set((state) => ({
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, creditBalance: customer.creditBalance }
            : state.selectedCustomer,
        addingCredit: false,
      }));
      return customer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al agregar crédito',
        addingCredit: false,
      });
      throw error;
    }
  },

  addNote: async (id: string, data: AddNoteRequest) => {
    set({ addingNote: true, error: null });
    try {
      const note = await customersApi.addNote(id, data);
      set((state) => ({
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? {
                ...state.selectedCustomer,
                recentNotes: [note, ...(state.selectedCustomer.recentNotes || [])],
              }
            : state.selectedCustomer,
        addingNote: false,
      }));
      return note;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al agregar nota',
        addingNote: false,
      });
      throw error;
    }
  },

  loadNotes: async (id: string, limit?: number) => {
    set({ loadingNotes: true, error: null });
    try {
      const notes = await customersApi.getNotes(id, limit);
      set((state) => ({
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, recentNotes: notes }
            : state.selectedCustomer,
        loadingNotes: false,
      }));
      return notes;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar notas',
        loadingNotes: false,
      });
      throw error;
    }
  },

  loadReputationHistory: async (id: string, limit?: number) => {
    set({ loadingHistory: true, error: null });
    try {
      const history = await customersApi.getReputationHistory(id, limit);
      set((state) => ({
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, reputationHistory: history }
            : state.selectedCustomer,
        loadingHistory: false,
      }));
      return history;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar historial',
        loadingHistory: false,
      });
      throw error;
    }
  },

  setFilters: (filters: Partial<FiltersState>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page on filter change
    }));
  },

  resetFilters: () => {
    set({
      filters: { ...defaultFilters },
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },

  setSelectedCustomer: (customer: CustomerWithRelations | null) => {
    set({ selectedCustomer: customer });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCustomers: () => {
    set({
      customers: [],
      selectedCustomer: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      filters: { ...defaultFilters },
    });
  },

  // Socket event handlers for real-time updates
  handleCustomerCreated: (customer: CustomerSummary) => {
    set((state) => {
      // Only add if not already in the list
      const exists = state.customers.some((c) => c.id === customer.id);
      if (exists) return state;

      return {
        customers: [customer, ...state.customers],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };
    });
  },

  handleCustomerUpdated: (customer: CustomerSummary) => {
    set((state) => ({
      customers: state.customers.map((c) => (c.id === customer.id ? customer : c)),
    }));
  },

  handleCustomerBlocked: (customerId: string, isBlocked: boolean) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, isBlocked } : c
      ),
      selectedCustomer:
        state.selectedCustomer?.id === customerId
          ? { ...state.selectedCustomer, isBlocked }
          : state.selectedCustomer,
    }));
  },

  handleReputationUpdated: (customerId: string, score: number, level: ReputationLevel) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, reputationScore: score, reputationLevel: level }
          : c
      ),
      selectedCustomer:
        state.selectedCustomer?.id === customerId
          ? { ...state.selectedCustomer, reputationScore: score, reputationLevel: level }
          : state.selectedCustomer,
    }));
  },

  handleCreditUpdated: (customerId: string, creditBalance: number) => {
    set((state) => ({
      selectedCustomer:
        state.selectedCustomer?.id === customerId
          ? { ...state.selectedCustomer, creditBalance }
          : state.selectedCustomer,
    }));
  },

  handleNoteAdded: (customerId: string, note: CustomerNote) => {
    set((state) => ({
      selectedCustomer:
        state.selectedCustomer?.id === customerId
          ? {
              ...state.selectedCustomer,
              recentNotes: [note, ...(state.selectedCustomer.recentNotes || [])],
            }
          : state.selectedCustomer,
    }));
  },
}));
