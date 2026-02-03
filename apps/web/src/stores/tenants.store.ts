// Tenants Store (Zustand)
// Manages tenant state for admin dashboard

import { create } from 'zustand';
import {
  tenantsApi,
  Tenant,
  TenantListResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
  QueryTenantParams,
} from '@/lib/tenants-api';
import { ApiError } from '@/lib/api';

// Store state interface
interface TenantsState {
  // Data
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Loading states
  loading: boolean;
  loadingTenant: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  // Error state
  error: string | null;
}

// Store actions interface
interface TenantsActions {
  // CRUD operations
  fetchTenants: (params?: QueryTenantParams) => Promise<void>;
  fetchTenantById: (id: string) => Promise<Tenant>;
  createTenant: (data: CreateTenantRequest) => Promise<Tenant>;
  updateTenant: (id: string, data: UpdateTenantRequest) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<void>;
  suspendTenant: (id: string, reason?: string) => Promise<Tenant>;
  reactivateTenant: (id: string) => Promise<Tenant>;

  // Selection
  selectTenant: (tenant: Tenant | null) => void;

  // State management
  clearError: () => void;
  reset: () => void;
}

// Combined store type
type TenantsStore = TenantsState & TenantsActions;

// Initial state
const initialState: TenantsState = {
  tenants: [],
  selectedTenant: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  loading: false,
  loadingTenant: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

// Create the store
export const useTenantsStore = create<TenantsStore>((set, get) => ({
  ...initialState,

  /**
   * Fetch paginated list of tenants
   */
  fetchTenants: async (params?: QueryTenantParams) => {
    set({ loading: true, error: null });

    try {
      const response = await tenantsApi.list(params);

      set({
        tenants: response.items,
        pagination: {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        },
        loading: false,
      });
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al cargar los tenants';

      set({ loading: false, error });
      throw err;
    }
  },

  /**
   * Fetch tenant by ID
   */
  fetchTenantById: async (id: string) => {
    set({ loadingTenant: true, error: null });

    try {
      const tenant = await tenantsApi.getById(id);

      set({
        selectedTenant: tenant,
        loadingTenant: false,
      });

      return tenant;
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al cargar el tenant';

      set({ loadingTenant: false, error });
      throw err;
    }
  },

  /**
   * Create a new tenant
   */
  createTenant: async (data: CreateTenantRequest) => {
    set({ creating: true, error: null });

    try {
      const tenant = await tenantsApi.create(data);

      // Add to list
      set((state) => ({
        tenants: [tenant, ...state.tenants],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
        creating: false,
      }));

      return tenant;
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al crear el tenant';

      set({ creating: false, error });
      throw err;
    }
  },

  /**
   * Update a tenant
   */
  updateTenant: async (id: string, data: UpdateTenantRequest) => {
    set({ updating: true, error: null });

    try {
      const tenant = await tenantsApi.update(id, data);

      // Update in list
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        updating: false,
      }));

      return tenant;
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al actualizar el tenant';

      set({ updating: false, error });
      throw err;
    }
  },

  /**
   * Delete a tenant
   */
  deleteTenant: async (id: string) => {
    set({ deleting: true, error: null });

    try {
      await tenantsApi.delete(id);

      // Remove from list or update status
      set((state) => ({
        tenants: state.tenants.filter((t) => t.id !== id),
        selectedTenant: state.selectedTenant?.id === id ? null : state.selectedTenant,
        pagination: {
          ...state.pagination,
          total: state.pagination.total - 1,
        },
        deleting: false,
      }));
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al eliminar el tenant';

      set({ deleting: false, error });
      throw err;
    }
  },

  /**
   * Suspend a tenant
   */
  suspendTenant: async (id: string, reason?: string) => {
    set({ updating: true, error: null });

    try {
      const tenant = await tenantsApi.suspend(id, reason);

      // Update in list
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        updating: false,
      }));

      return tenant;
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al suspender el tenant';

      set({ updating: false, error });
      throw err;
    }
  },

  /**
   * Reactivate a suspended tenant
   */
  reactivateTenant: async (id: string) => {
    set({ updating: true, error: null });

    try {
      const tenant = await tenantsApi.reactivate(id);

      // Update in list
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        updating: false,
      }));

      return tenant;
    } catch (err) {
      const error = err instanceof ApiError
        ? err.message
        : 'Error al reactivar el tenant';

      set({ updating: false, error });
      throw err;
    }
  },

  /**
   * Select a tenant for viewing/editing
   */
  selectTenant: (tenant: Tenant | null) => {
    set({ selectedTenant: tenant });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));
