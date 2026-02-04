// Payments Store
// Zustand store for payment state management

import { create } from 'zustand';
import {
  paymentsApi,
  type Payment,
  type PaymentStatus,
  type PaymentType,
  type PreferenceResponse,
  type PaymentStatusResponse,
  type CreatePreferenceRequest,
  type QueryPaymentParams,
} from '@/lib/payments-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FiltersState {
  bookingId: string | null;
  customerId: string | null;
  type: PaymentType | null;
  status: PaymentStatus | null;
  search: string;
  sortBy: QueryPaymentParams['sortBy'];
  sortOrder: 'asc' | 'desc';
}

interface PaymentsState {
  // Data
  payments: Payment[];
  selectedPayment: Payment | null;
  currentPreference: PreferenceResponse | null;
  bookingPayments: Map<string, Payment[]>;
  pagination: PaginationState;
  filters: FiltersState;

  // Loading states
  loading: boolean;
  loadingPayment: boolean;
  creatingPreference: boolean;
  refreshingStatus: boolean;

  // Error state
  error: string | null;

  // Actions
  loadPayments: (params?: QueryPaymentParams) => Promise<void>;
  loadPayment: (id: string) => Promise<void>;
  createPreference: (data: CreatePreferenceRequest) => Promise<PreferenceResponse>;
  getPaymentStatus: (id: string) => Promise<PaymentStatusResponse>;
  refreshPaymentStatus: (id: string) => Promise<PaymentStatusResponse>;
  loadBookingPayments: (bookingId: string) => Promise<Payment[]>;
  setFilters: (filters: Partial<FiltersState>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSelectedPayment: (payment: Payment | null) => void;
  clearCurrentPreference: () => void;
  clearError: () => void;
  clearPayments: () => void;

  // Socket event handlers
  handlePaymentCreated: (payment: Payment) => void;
  handlePaymentUpdated: (payment: Payment) => void;
  handlePaymentStatusChanged: (paymentId: string, status: PaymentStatus) => void;
}

const defaultFilters: FiltersState = {
  bookingId: null,
  customerId: null,
  type: null,
  status: null,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  // Initial state
  payments: [],
  selectedPayment: null,
  currentPreference: null,
  bookingPayments: new Map(),
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
  filters: { ...defaultFilters },
  loading: false,
  loadingPayment: false,
  creatingPreference: false,
  refreshingStatus: false,
  error: null,

  // Actions
  loadPayments: async (params?: QueryPaymentParams) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams: QueryPaymentParams = {
        page: pagination.page,
        limit: pagination.limit,
        bookingId: filters.bookingId || undefined,
        customerId: filters.customerId || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...params,
      };

      const response = await paymentsApi.list(queryParams);
      set({
        payments: response.items,
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
        error: error instanceof Error ? error.message : 'Error al cargar pagos',
        loading: false,
      });
    }
  },

  loadPayment: async (id: string) => {
    set({ loadingPayment: true, error: null });
    try {
      const payment = await paymentsApi.getById(id);
      set({ selectedPayment: payment, loadingPayment: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar pago',
        loadingPayment: false,
      });
    }
  },

  createPreference: async (data: CreatePreferenceRequest) => {
    set({ creatingPreference: true, error: null });
    try {
      const preference = await paymentsApi.createPreference(data);
      set({ currentPreference: preference, creatingPreference: false });
      return preference;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear link de pago',
        creatingPreference: false,
      });
      throw error;
    }
  },

  getPaymentStatus: async (id: string) => {
    try {
      return await paymentsApi.getStatus(id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al obtener estado del pago',
      });
      throw error;
    }
  },

  refreshPaymentStatus: async (id: string) => {
    set({ refreshingStatus: true, error: null });
    try {
      const status = await paymentsApi.refreshStatus(id);

      // Update the payment in the list if it exists
      set((state) => ({
        payments: state.payments.map((p) =>
          p.id === id ? { ...p, status: status.status, externalStatus: status.externalStatus } : p
        ),
        selectedPayment:
          state.selectedPayment?.id === id
            ? { ...state.selectedPayment, status: status.status, externalStatus: status.externalStatus }
            : state.selectedPayment,
        refreshingStatus: false,
      }));

      return status;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar estado del pago',
        refreshingStatus: false,
      });
      throw error;
    }
  },

  loadBookingPayments: async (bookingId: string) => {
    try {
      const payments = await paymentsApi.getByBooking(bookingId);
      set((state) => ({
        bookingPayments: new Map(state.bookingPayments).set(bookingId, payments),
      }));
      return payments;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar pagos de la reserva',
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
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },

  setSelectedPayment: (payment: Payment | null) => {
    set({ selectedPayment: payment });
  },

  clearCurrentPreference: () => {
    set({ currentPreference: null });
  },

  clearError: () => {
    set({ error: null });
  },

  clearPayments: () => {
    set({
      payments: [],
      selectedPayment: null,
      currentPreference: null,
      bookingPayments: new Map(),
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
      filters: { ...defaultFilters },
    });
  },

  // Socket event handlers for real-time updates
  handlePaymentCreated: (payment: Payment) => {
    set((state) => {
      // Add to payments list
      const exists = state.payments.some((p) => p.id === payment.id);
      if (exists) return state;

      // Update booking payments map if applicable
      const newBookingPayments = new Map(state.bookingPayments);
      if (payment.bookingId) {
        const bookingPayments = newBookingPayments.get(payment.bookingId) || [];
        if (!bookingPayments.some((p) => p.id === payment.id)) {
          newBookingPayments.set(payment.bookingId, [...bookingPayments, payment]);
        }
      }

      return {
        payments: [payment, ...state.payments],
        bookingPayments: newBookingPayments,
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };
    });
  },

  handlePaymentUpdated: (payment: Payment) => {
    set((state) => {
      // Update booking payments map if applicable
      const newBookingPayments = new Map(state.bookingPayments);
      if (payment.bookingId) {
        const bookingPayments = newBookingPayments.get(payment.bookingId) || [];
        newBookingPayments.set(
          payment.bookingId,
          bookingPayments.map((p) => (p.id === payment.id ? payment : p))
        );
      }

      return {
        payments: state.payments.map((p) => (p.id === payment.id ? payment : p)),
        selectedPayment:
          state.selectedPayment?.id === payment.id ? payment : state.selectedPayment,
        bookingPayments: newBookingPayments,
      };
    });
  },

  handlePaymentStatusChanged: (paymentId: string, status: PaymentStatus) => {
    set((state) => ({
      payments: state.payments.map((p) =>
        p.id === paymentId ? { ...p, status } : p
      ),
      selectedPayment:
        state.selectedPayment?.id === paymentId
          ? { ...state.selectedPayment, status }
          : state.selectedPayment,
    }));
  },
}));
