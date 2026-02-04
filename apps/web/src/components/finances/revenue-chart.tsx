// Revenue Chart Component
// Displays revenue breakdown with visual chart

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueReport } from '@/lib/reports-api';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { MdOutlineAttachMoney, MdOutlineMoneyOff } from 'react-icons/md';

interface RevenueChartProps {
  data: RevenueReport;
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Calculate percentages
  const depositsPercentage = data.totalRevenue > 0
    ? ((data.deposits / data.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const balancePercentage = data.totalRevenue > 0
    ? ((data.balancePayments / data.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const refundsPercentage = data.totalRevenue > 0
    ? ((data.refunds / data.totalRevenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card className="animate-fade-up-fast">
        <CardHeader>
          <CardTitle>Resumen de Ingresos - {data.period}</CardTitle>
          <CardDescription>
            Desglose detallado de ingresos por tipo de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Breakdown */}
          <div className="space-y-3">
            {/* Deposits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MdOutlineAttachMoney className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Señas</span>
                </div>
                <span className="font-semibold">${data.deposits.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${depositsPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {depositsPercentage}% del total
              </p>
            </div>

            {/* Balance Payments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Saldos Pagados</span>
                </div>
                <span className="font-semibold">${data.balancePayments.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${balancePercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {balancePercentage}% del total
              </p>
            </div>

            {/* Refunds */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MdOutlineMoneyOff className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Reembolsos</span>
                </div>
                <span className="font-semibold text-red-500">
                  -${data.refunds.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${refundsPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {refundsPercentage}% del total
              </p>
            </div>
          </div>

          {/* Total Revenue Line */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">Ingresos Netos</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                ${data.netRevenue.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total después de reembolsos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-fade-left-normal">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.bookingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reservas en el período
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up-light-slow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sesiones Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.completedSessions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.bookingCount > 0
                ? `${((data.completedSessions / data.bookingCount) * 100).toFixed(1)}% del total`
                : '0% del total'}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-right-normal">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cancelaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {data.cancellations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.bookingCount > 0
                ? `${((data.cancellations / data.bookingCount) * 100).toFixed(1)}% del total`
                : '0% del total'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
