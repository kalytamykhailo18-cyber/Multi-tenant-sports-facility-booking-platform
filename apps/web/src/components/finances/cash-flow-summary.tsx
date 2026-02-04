// Cash Flow Summary Component
// Displays money in vs money out analysis

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CashFlow } from '@/lib/reports-api';
import { FiTrendingUp, FiTrendingDown, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { MdOutlineAttachMoney } from 'react-icons/md';

interface CashFlowSummaryProps {
  data: CashFlow;
}

export function CashFlowSummary({ data }: CashFlowSummaryProps) {
  const isPositive = data.netCashFlow >= 0;
  const flowPercentage = data.moneyIn.total > 0
    ? ((data.netCashFlow / data.moneyIn.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Net Cash Flow Card */}
      <Card className={`animate-fade-up-fast ${isPositive ? 'border-green-200' : 'border-red-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPositive ? (
              <FiTrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <FiTrendingDown className="w-5 h-5 text-red-500" />
            )}
            Flujo de Caja Neto
          </CardTitle>
          <CardDescription>
            {data.dateRange.startDate} a {data.dateRange.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}${data.netCashFlow.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {flowPercentage}% de margen neto
          </p>
        </CardContent>
      </Card>

      {/* Money In/Out Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Money In */}
        <Card className="animate-fade-left-normal">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FiArrowUp className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">Dinero Entrante</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Deposits */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Señas</span>
                <span className="font-semibold">${data.moneyIn.deposits.toLocaleString()}</span>
              </div>

              {/* Balance Payments */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldos</span>
                <span className="font-semibold">
                  ${data.moneyIn.balancePayments.toLocaleString()}
                </span>
              </div>

              {/* Total In */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Entrante</span>
                  <span className="text-xl font-bold text-green-600">
                    ${data.moneyIn.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Money Out */}
        <Card className="animate-fade-right-normal">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FiArrowDown className="w-5 h-5 text-red-500" />
              <CardTitle className="text-lg">Dinero Saliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Refunds */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reembolsos</span>
                <span className="font-semibold">${data.moneyOut.refunds.toLocaleString()}</span>
              </div>

              {/* Placeholder for future expenses */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Otros Egresos</span>
                <span className="font-semibold">$0</span>
              </div>

              {/* Total Out */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Saliente</span>
                  <span className="text-xl font-bold text-red-600">
                    -${data.moneyOut.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Flow Chart */}
      <Card className="animate-fade-up-slow">
        <CardHeader>
          <CardTitle>Balance Visual</CardTitle>
          <CardDescription>Comparación de ingresos y egresos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Money In Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Ingresos</span>
                <span className="font-semibold text-green-600">
                  ${data.moneyIn.total.toLocaleString()}
                </span>
              </div>
              <div className="h-8 bg-muted rounded-md overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-md flex items-center justify-end pr-3"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs font-semibold text-white">100%</span>
                </div>
              </div>
            </div>

            {/* Money Out Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Egresos</span>
                <span className="font-semibold text-red-600">
                  ${data.moneyOut.total.toLocaleString()}
                </span>
              </div>
              <div className="h-8 bg-muted rounded-md overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-md flex items-center justify-end pr-3"
                  style={{
                    width: data.moneyIn.total > 0
                      ? `${(data.moneyOut.total / data.moneyIn.total) * 100}%`
                      : '0%',
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {data.moneyIn.total > 0
                      ? `${((data.moneyOut.total / data.moneyIn.total) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Result */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MdOutlineAttachMoney className="w-5 h-5" />
                  <span className="font-semibold">Resultado Neto</span>
                </div>
                <div className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${data.netCashFlow.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
