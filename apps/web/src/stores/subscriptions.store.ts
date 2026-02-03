// Subscriptions Store
// Zustand store for subscription state management

import { create } from 'zustand';
import {
  subscriptionsApi,
  type Subscription,
  type QuerySubscriptionParams,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
} from '@/lib/subscriptions-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SubscriptionsState {
  // Data
  subscriptions: Subscription[];
  selectedSubscription: Subscription | null;
  pagination: PaginationState;

  // Loading states
  loading: boolean;
  loadingSubscription: boolean;
  creating: boolean;
  updating: boolean;
  suspending: boolean;
  reactivating: boolean;
  cancelling: boolean;

  // Error state
  error: string | null;

  // Actions
  loadSubscriptions: (params?: QuerySubscriptionParams) => Promise<void>;
  loadSubscription: (id: string) => Promise<void>;
  loadSubscriptionByTenant: (tenantId: string) => Promise<void>;
  create: (data: CreateSubscriptionRequest) => Promise<Subscription>;
  update: (id: string, data: UpdateSubscriptionRequest) => Promise<Subscription>;
  suspend: (id: string, reason?: string) => Promise<Subscription>;
  reactivate: (id: string) => Promise<Subscription>;
  cancel: (id: string, reason?: string) => Promise<Subscription>;
  checkStatuses: () => Promise<{ updated: number; suspended: number }>;
  setSelectedSubscription: (subscription: Subscription | null) => void;
  clearError: () => void;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set) => ({
  // Initial state
  subscriptions: [],
  selectedSubscription: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  loading: false,
  loadingSubscription: false,
  creating: false,
  updating: false,
  suspending: false,
  reactivating: false,
  cancelling: false,
  error: null,

  // Actions
  loadSubscriptions: async (params?: QuerySubscriptionParams) => {
    set({ loading: true, error: null });
    try {
      const response = await subscriptionsApi.list(params);
      set({
        subscriptions: response.items,
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
        error: error instanceof Error ? error.message : 'Error al cargar suscripciones',
        loading: false,
      });
    }
  },

  loadSubscription: async (id: string) => {
    set({ loadingSubscription: true, error: null });
    try {
      const subscription = await subscriptionsApi.getById(id);
      set({ selectedSubscription: subscription, loadingSubscription: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar suscripción',
        loadingSubscription: false,
      });
    }
  },

  loadSubscriptionByTenant: async (tenantId: string) => {
    set({ loadingSubscription: true, error: null });
    try {
      const subscription = await subscriptionsApi.getByTenantId(tenantId);
      set({ selectedSubscription: subscription, loadingSubscription: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar suscripción',
        loadingSubscription: false,
      });
    }
  },

  create: async (data: CreateSubscriptionRequest) => {
    set({ creating: true, error: null });
    try {
      const subscription = await subscriptionsApi.create(data);
      set((state) => ({
        subscriptions: [subscription, ...state.subscriptions],
        creating: false,
      }));
      return subscription;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear suscripción',
        creating: false,
      });
      throw error;
    }
  },

  update: async (id: string, data: UpdateSubscriptionRequest) => {
    set({ updating: true, error: null });
    try {
      const subscription = await subscriptionsApi.update(id, data);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? subscription : s)),
        selectedSubscription: state.selectedSubscription?.id === id ? subscription : state.selectedSubscription,
        updating: false,
      }));
      return subscription;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar suscripción',
        updating: false,
      });
      throw error;
    }
  },

  suspend: async (id: string, reason?: string) => {
    set({ suspending: true, error: null });
    try {
      const subscription = await subscriptionsApi.suspend(id, reason);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? subscription : s)),
        selectedSubscription: state.selectedSubscription?.id === id ? subscription : state.selectedSubscription,
        suspending: false,
      }));
      return subscription;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al suspender suscripción',
        suspending: false,
      });
      throw error;
    }
  },

  reactivate: async (id: string) => {
    set({ reactivating: true, error: null });
    try {
      const subscription = await subscriptionsApi.reactivate(id);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? subscription : s)),
        selectedSubscription: state.selectedSubscription?.id === id ? subscription : state.selectedSubscription,
        reactivating: false,
      }));
      return subscription;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al reactivar suscripción',
        reactivating: false,
      });
      throw error;
    }
  },

  cancel: async (id: string, reason?: string) => {
    set({ cancelling: true, error: null });
    try {
      const subscription = await subscriptionsApi.cancel(id, reason);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? subscription : s)),
        selectedSubscription: state.selectedSubscription?.id === id ? subscription : state.selectedSubscription,
        cancelling: false,
      }));
      return subscription;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cancelar suscripción',
        cancelling: false,
      });
      throw error;
    }
  },

  checkStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const result = await subscriptionsApi.checkStatuses();
      set({ loading: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al verificar estados',
        loading: false,
      });
      throw error;
    }
  },

  setSelectedSubscription: (subscription: Subscription | null) => {
    set({ selectedSubscription: subscription });
  },

  clearError: () => {
    set({ error: null });
  },
}));
