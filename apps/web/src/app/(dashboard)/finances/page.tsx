// Financial Reports Page
// Revenue reports, cash flow, client debts, and payment history

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useReports } from '@/hooks/useReports';
import { reportsApi } from '@/lib/reports-api';
import { AccessDenied } from '@/components/auth/access-denied';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RevenueChart } from '@/components/finances/revenue-chart';
import { CashFlowSummary } from '@/components/finances/cash-flow-summary';
import { ClientDebtsTable } from '@/components/finances/client-debts-table';
import { RevenueProjectionsCard } from '@/components/finances/revenue-projections-card';
import { PaymentHistoryTable } from '@/components/finances/payment-history-table';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiUsers, FiClock } from 'react-icons/fi';
import { BiDownload } from 'react-icons/bi';
import { MdOutlineAttachMoney, MdOutlineMoneyOff } from 'react-icons/md';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export default function FinancesPage() {
  const { user } = useAuth();
  const { permissions, isStaff } = usePermissions();
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
    isLoading,
    error,
    loadDailyRevenue,
    loadWeeklyRevenue,
    loadMonthlyRevenue,
    loadCashFlow,
    loadClientDebts,
    loadRevenueProjections,
    loadPaymentHistory,
    clearError,
  } = useReports();

  // Placeholder facilityId - in real implementation, get from auth context or route
  const [facilityId] = useState<string>('facility-id-placeholder');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Load data on mount and when period changes
  useEffect(() => {
    loadReports();
  }, [reportPeriod, selectedDate, selectedMonth, facilityId]);

  const loadReports = () => {
    // Load revenue based on selected period
    if (reportPeriod === 'daily') {
      loadDailyRevenue({ facilityId, date: selectedDate });
    } else if (reportPeriod === 'weekly') {
      // Get Monday of the selected week
      const date = new Date(selectedDate);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekStart = monday.toISOString().split('T')[0];
      loadWeeklyRevenue({ facilityId, weekStart });
    } else {
      loadMonthlyRevenue({ facilityId, month: selectedMonth });
    }

    // Load other reports
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    loadCashFlow({
      facilityId,
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: lastDayOfMonth.toISOString().split('T')[0],
    });

    loadClientDebts({ facilityId });
    loadRevenueProjections({ facilityId, daysAhead: 30 });
    loadPaymentHistory({ facilityId, page: 1, pageSize: 50 });
  };

  // Export handlers
  const handleExportPDF = () => {
    const url = reportsApi.exportRevenuePDF(
      facilityId,
      reportPeriod,
      selectedDate,
      selectedMonth
    );
    window.open(url, '_blank');
  };

  const handleExportExcel = () => {
    const url = reportsApi.exportRevenueExcel(
      facilityId,
      reportPeriod,
      selectedDate,
      selectedMonth
    );
    window.open(url, '_blank');
  };

  // Check if user has permission to view finances
  if (!permissions.canViewFinances) {
    return (
      <AccessDenied
        title="Acceso Restringido"
        message="No tienes permisos para acceder a los reportes financieros."
        requiredRole="Propietario o Super Admin"
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-down-fast">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground">
            Reportes financieros y análisis de ingresos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-md" onClick={handleExportPDF}>
            <BiDownload className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" className="rounded-md" onClick={handleExportExcel}>
            <BiDownload className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive animate-fade-up-fast">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Selector */}
      <Card className="animate-fade-left-normal">
        <CardHeader>
          <CardTitle>Período de Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Select value={reportPeriod} onValueChange={(value) => setReportPeriod(value as ReportPeriod)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>

            {(reportPeriod === 'daily' || reportPeriod === 'weekly') && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            )}

            {reportPeriod === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            )}

            <Button onClick={loadReports} disabled={isLoading} className="rounded-md">
              {isLoading ? <Spinner className="w-4 h-4" /> : 'Actualizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Overview */}
      {revenueReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="animate-fade-up-normal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <FiDollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueReport.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{revenueReport.period}</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-down-normal">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
              {revenueReport.netRevenue >= 0 ? (
                <FiTrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <FiTrendingDown className="w-4 h-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueReport.netRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Después de reembolsos
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-left-slow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas</CardTitle>
              <FiClock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueReport.bookingCount}</div>
              <p className="text-xs text-muted-foreground">
                {revenueReport.completedSessions} completadas
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-right-slow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelaciones</CardTitle>
              <MdOutlineMoneyOff className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueReport.cancellations}</div>
              <p className="text-xs text-muted-foreground">
                ${revenueReport.refunds.toLocaleString()} reembolsado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different reports */}
      <Tabs defaultValue="revenue" className="animate-fade-up-slow">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
          <TabsTrigger value="debts">Deudas</TabsTrigger>
          <TabsTrigger value="projections">Proyecciones</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          {loadingRevenue ? (
            <div className="flex justify-center p-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : revenueReport ? (
            <RevenueChart data={revenueReport} />
          ) : null}
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          {loadingCashFlow ? (
            <div className="flex justify-center p-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : cashFlow ? (
            <CashFlowSummary data={cashFlow} />
          ) : null}
        </TabsContent>

        <TabsContent value="debts" className="space-y-4">
          {loadingDebts ? (
            <div className="flex justify-center p-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : clientDebts ? (
            <ClientDebtsTable data={clientDebts} />
          ) : null}
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          {loadingProjections ? (
            <div className="flex justify-center p-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : revenueProjection ? (
            <RevenueProjectionsCard data={revenueProjection} />
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingPaymentHistory ? (
            <div className="flex justify-center p-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : paymentHistory ? (
            <PaymentHistoryTable data={paymentHistory} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
