// Reports Store
// Zustand store for financial reports state management

import { create } from 'zustand';
import {
  reportsApi,
  type RevenueReport,
  type CashFlow,
  type ClientDebtsResponse,
  type RevenueProjection,
  type PaymentHistoryResponse,
  type DailyRevenueParams,
  type WeeklyRevenueParams,
  type MonthlyRevenueParams,
  type CashFlowParams,
  type ClientDebtsParams,
  type RevenueProjectionParams,
  type PaymentHistoryParams,
} from '@/lib/reports-api';

interface ReportsState {
  // Data
  revenueReport: RevenueReport | null;
  cashFlow: CashFlow | null;
  clientDebts: ClientDebtsResponse | null;
  revenueProjection: RevenueProjection | null;
  paymentHistory: PaymentHistoryResponse | null;

  // Loading states
  loadingRevenue: boolean;
  loadingCashFlow: boolean;
  loadingDebts: boolean;
  loadingProjections: boolean;
  loadingPaymentHistory: boolean;

  // Error state
  error: string | null;

  // Actions
  loadDailyRevenue: (params: DailyRevenueParams) => Promise<void>;
  loadWeeklyRevenue: (params: WeeklyRevenueParams) => Promise<void>;
  loadMonthlyRevenue: (params: MonthlyRevenueParams) => Promise<void>;
  loadCashFlow: (params: CashFlowParams) => Promise<void>;
  loadClientDebts: (params: ClientDebtsParams) => Promise<void>;
  loadRevenueProjections: (params: RevenueProjectionParams) => Promise<void>;
  loadPaymentHistory: (params: PaymentHistoryParams) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  revenueReport: null,
  cashFlow: null,
  clientDebts: null,
  revenueProjection: null,
  paymentHistory: null,
  loadingRevenue: false,
  loadingCashFlow: false,
  loadingDebts: false,
  loadingProjections: false,
  loadingPaymentHistory: false,
  error: null,
};

export const useReportsStore = create<ReportsState>((set) => ({
  ...initialState,

  // Actions
  loadDailyRevenue: async (params: DailyRevenueParams) => {
    set({ loadingRevenue: true, error: null });
    try {
      const revenueReport = await reportsApi.getDailyRevenue(params);
      set({ revenueReport, loadingRevenue: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar reporte diario',
        loadingRevenue: false,
      });
    }
  },

  loadWeeklyRevenue: async (params: WeeklyRevenueParams) => {
    set({ loadingRevenue: true, error: null });
    try {
      const revenueReport = await reportsApi.getWeeklyRevenue(params);
      set({ revenueReport, loadingRevenue: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar reporte semanal',
        loadingRevenue: false,
      });
    }
  },

  loadMonthlyRevenue: async (params: MonthlyRevenueParams) => {
    set({ loadingRevenue: true, error: null });
    try {
      const revenueReport = await reportsApi.getMonthlyRevenue(params);
      set({ revenueReport, loadingRevenue: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar reporte mensual',
        loadingRevenue: false,
      });
    }
  },

  loadCashFlow: async (params: CashFlowParams) => {
    set({ loadingCashFlow: true, error: null });
    try {
      const cashFlow = await reportsApi.getCashFlow(params);
      set({ cashFlow, loadingCashFlow: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar flujo de caja',
        loadingCashFlow: false,
      });
    }
  },

  loadClientDebts: async (params: ClientDebtsParams) => {
    set({ loadingDebts: true, error: null });
    try {
      const clientDebts = await reportsApi.getClientDebts(params);
      set({ clientDebts, loadingDebts: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar deudas de clientes',
        loadingDebts: false,
      });
    }
  },

  loadRevenueProjections: async (params: RevenueProjectionParams) => {
    set({ loadingProjections: true, error: null });
    try {
      const revenueProjection = await reportsApi.getRevenueProjections(params);
      set({ revenueProjection, loadingProjections: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar proyecciones',
        loadingProjections: false,
      });
    }
  },

  loadPaymentHistory: async (params: PaymentHistoryParams) => {
    set({ loadingPaymentHistory: true, error: null });
    try {
      const paymentHistory = await reportsApi.getPaymentHistory(params);
      set({ paymentHistory, loadingPaymentHistory: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar historial de pagos',
        loadingPaymentHistory: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
