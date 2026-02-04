// Reports Hook
// Custom hook for financial reports state management

'use client';

import { useCallback } from 'react';
import { useReportsStore } from '@/stores/reports.store';
import type {
  DailyRevenueParams,
  WeeklyRevenueParams,
  MonthlyRevenueParams,
  CashFlowParams,
  ClientDebtsParams,
  RevenueProjectionParams,
  PaymentHistoryParams,
} from '@/lib/reports-api';

/**
 * Main hook for financial reports data
 * Provides all reports-related state and actions
 */
export function useReports() {
  const {
    revenueReport,
    cashFlow,
    clientDebts,
    revenueProjection,
    paymentHistory,
    loadingRevenue,
    loadingCashFlow,
    loadingDebts,
    loadingProjections,
    loadingPaymentHistory,
    error,
    loadDailyRevenue,
    loadWeeklyRevenue,
    loadMonthlyRevenue,
    loadCashFlow,
    loadClientDebts,
    loadRevenueProjections,
    loadPaymentHistory,
    clearError,
    reset,
  } = useReportsStore();

  // Memoized callbacks for stable references
  const handleLoadDailyRevenue = useCallback(
    (params: DailyRevenueParams) => loadDailyRevenue(params),
    [loadDailyRevenue],
  );

  const handleLoadWeeklyRevenue = useCallback(
    (params: WeeklyRevenueParams) => loadWeeklyRevenue(params),
    [loadWeeklyRevenue],
  );

  const handleLoadMonthlyRevenue = useCallback(
    (params: MonthlyRevenueParams) => loadMonthlyRevenue(params),
    [loadMonthlyRevenue],
  );

  const handleLoadCashFlow = useCallback(
    (params: CashFlowParams) => loadCashFlow(params),
    [loadCashFlow],
  );

  const handleLoadClientDebts = useCallback(
    (params: ClientDebtsParams) => loadClientDebts(params),
    [loadClientDebts],
  );

  const handleLoadRevenueProjections = useCallback(
    (params: RevenueProjectionParams) => loadRevenueProjections(params),
    [loadRevenueProjections],
  );

  const handleLoadPaymentHistory = useCallback(
    (params: PaymentHistoryParams) => loadPaymentHistory(params),
    [loadPaymentHistory],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  const handleReset = useCallback(() => reset(), [reset]);

  // Computed values
  const isLoading =
    loadingRevenue ||
    loadingCashFlow ||
    loadingDebts ||
    loadingProjections ||
    loadingPaymentHistory;

  const hasRevenueData = revenueReport !== null;
  const hasCashFlowData = cashFlow !== null;
  const hasDebtsData = clientDebts !== null;
  const hasProjectionsData = revenueProjection !== null;
  const hasPaymentHistoryData = paymentHistory !== null;

  // Revenue statistics
  const revenueGrowth = revenueReport
    ? ((revenueReport.netRevenue / revenueReport.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const cancellationRate = revenueReport && revenueReport.bookingCount > 0
    ? ((revenueReport.cancellations / revenueReport.bookingCount) * 100).toFixed(1)
    : '0.0';

  // Cash flow statistics
  const cashFlowPositive = cashFlow ? cashFlow.netCashFlow > 0 : false;
  const cashFlowPercentage = cashFlow && cashFlow.moneyIn.total > 0
    ? ((cashFlow.netCashFlow / cashFlow.moneyIn.total) * 100).toFixed(1)
    : '0.0';

  // Client debts statistics
  const totalDebtAmount = clientDebts?.totalDebt || 0;
  const debtorsCount = clientDebts?.clientCount || 0;
  const avgDebtPerClient = debtorsCount > 0
    ? (totalDebtAmount / debtorsCount).toFixed(2)
    : '0.00';

  // Revenue projections statistics
  const projectedGrowth = revenueProjection && revenueProjection.confirmedRevenue > 0
    ? ((revenueProjection.pendingRevenue / revenueProjection.confirmedRevenue) * 100).toFixed(1)
    : '0.0';

  return {
    // State
    revenueReport,
    cashFlow,
    clientDebts,
    revenueProjection,
    paymentHistory,
    loadingRevenue,
    loadingCashFlow,
    loadingDebts,
    loadingProjections,
    loadingPaymentHistory,
    isLoading,
    error,

    // Computed - Data availability
    hasRevenueData,
    hasCashFlowData,
    hasDebtsData,
    hasProjectionsData,
    hasPaymentHistoryData,

    // Computed - Statistics
    revenueGrowth,
    cancellationRate,
    cashFlowPositive,
    cashFlowPercentage,
    totalDebtAmount,
    debtorsCount,
    avgDebtPerClient,
    projectedGrowth,

    // Actions
    loadDailyRevenue: handleLoadDailyRevenue,
    loadWeeklyRevenue: handleLoadWeeklyRevenue,
    loadMonthlyRevenue: handleLoadMonthlyRevenue,
    loadCashFlow: handleLoadCashFlow,
    loadClientDebts: handleLoadClientDebts,
    loadRevenueProjections: handleLoadRevenueProjections,
    loadPaymentHistory: handleLoadPaymentHistory,
    clearError: handleClearError,
    reset: handleReset,
  };
}
