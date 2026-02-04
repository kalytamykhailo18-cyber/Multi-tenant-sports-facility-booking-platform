// Reports API Functions
// Frontend API client for financial reports endpoints

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export interface RevenueReport {
  totalRevenue: number;
  deposits: number;
  balancePayments: number;
  refunds: number;
  netRevenue: number;
  bookingCount: number;
  completedSessions: number;
  cancellations: number;
  period: string;
}

export interface CashFlow {
  moneyIn: {
    deposits: number;
    balancePayments: number;
    total: number;
  };
  moneyOut: {
    refunds: number;
    total: number;
  };
  netCashFlow: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface ClientDebt {
  customerId: string;
  customerName: string;
  customerPhone: string;
  debtAmount: number;
  pendingBookings: number;
  oldestBookingDate: string;
}

export interface ClientDebtsResponse {
  debts: ClientDebt[];
  totalDebt: number;
  clientCount: number;
}

export interface RevenueProjection {
  confirmedRevenue: number;
  pendingRevenue: number;
  totalProjection: number;
  confirmedBookings: number;
  pendingBookings: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export type PaymentType = 'DEPOSIT' | 'BALANCE' | 'REFUND';

export interface PaymentSummary {
  bookingId: string;
  date: string;
  customerName: string;
  amount: number;
  type: PaymentType;
  status: string;
  paidAt?: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DailyRevenueParams {
  facilityId: string;
  date: string; // YYYY-MM-DD
}

export interface WeeklyRevenueParams {
  facilityId: string;
  weekStart: string; // YYYY-MM-DD
}

export interface MonthlyRevenueParams {
  facilityId: string;
  month: string; // YYYY-MM
}

export interface CashFlowParams {
  facilityId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ClientDebtsParams {
  facilityId: string;
}

export interface RevenueProjectionParams {
  facilityId: string;
  daysAhead?: number;
}

export interface PaymentHistoryParams {
  facilityId: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// API Functions
// ============================================

export const reportsApi = {
  /**
   * Get daily revenue report
   */
  async getDailyRevenue(params: DailyRevenueParams): Promise<RevenueReport> {
    return apiClient.get<RevenueReport>('/reports/revenue/daily', { params });
  },

  /**
   * Get weekly revenue report
   */
  async getWeeklyRevenue(params: WeeklyRevenueParams): Promise<RevenueReport> {
    return apiClient.get<RevenueReport>('/reports/revenue/weekly', { params });
  },

  /**
   * Get monthly revenue report
   */
  async getMonthlyRevenue(params: MonthlyRevenueParams): Promise<RevenueReport> {
    return apiClient.get<RevenueReport>('/reports/revenue/monthly', { params });
  },

  /**
   * Get cash flow report
   */
  async getCashFlow(params: CashFlowParams): Promise<CashFlow> {
    return apiClient.get<CashFlow>('/reports/cash-flow', { params });
  },

  /**
   * Get clients with outstanding debts
   */
  async getClientDebts(params: ClientDebtsParams): Promise<ClientDebtsResponse> {
    return apiClient.get<ClientDebtsResponse>('/reports/client-debts', { params });
  },

  /**
   * Get revenue projections from future bookings
   */
  async getRevenueProjections(params: RevenueProjectionParams): Promise<RevenueProjection> {
    return apiClient.get<RevenueProjection>('/reports/projections', { params });
  },

  /**
   * Get payment history with pagination
   */
  async getPaymentHistory(params: PaymentHistoryParams): Promise<PaymentHistoryResponse> {
    return apiClient.get<PaymentHistoryResponse>('/reports/payment-history', { params });
  },

  /**
   * Export revenue report to Excel
   */
  exportRevenueExcel(facilityId: string, period: 'daily' | 'weekly' | 'monthly', date?: string, month?: string): string {
    const params = new URLSearchParams({ facilityId, period });
    if (date) params.append('date', date);
    if (month) params.append('month', month);
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/export/revenue/excel?${params.toString()}`;
  },

  /**
   * Export revenue report to PDF
   */
  exportRevenuePDF(facilityId: string, period: 'daily' | 'weekly' | 'monthly', date?: string, month?: string): string {
    const params = new URLSearchParams({ facilityId, period });
    if (date) params.append('date', date);
    if (month) params.append('month', month);
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/export/revenue/pdf?${params.toString()}`;
  },

  /**
   * Export cash flow report to Excel
   */
  exportCashFlowExcel(facilityId: string, startDate: string, endDate: string): string {
    const params = new URLSearchParams({ facilityId, startDate, endDate });
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/export/cashflow/excel?${params.toString()}`;
  },

  /**
   * Export cash flow report to PDF
   */
  exportCashFlowPDF(facilityId: string, startDate: string, endDate: string): string {
    const params = new URLSearchParams({ facilityId, startDate, endDate });
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/export/cashflow/pdf?${params.toString()}`;
  },

  /**
   * Export client debts to Excel
   */
  exportDebtsExcel(facilityId: string): string {
    const params = new URLSearchParams({ facilityId });
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/export/debts/excel?${params.toString()}`;
  },

  /**
   * Export payment history to Excel
   */
  exportPaymentsExcel(facilityId: string, page?: number, pageSize?: number): string {
    const params = new URLSearchParams({ facilityId });
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    return `${process.env.NEXT_PUBLIC_API_URL}/reports/export/payments/excel?${params.toString()}`;
  },
};
