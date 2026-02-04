// Revenue Projections Card Component
// Displays projected revenue from future bookings

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueProjection } from '@/lib/reports-api';
import { FiTrendingUp, FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi';
import { MdOutlineAttachMoney } from 'react-icons/md';

interface RevenueProjectionsCardProps {
  data: RevenueProjection;
}

export function RevenueProjectionsCard({ data }: RevenueProjectionsCardProps) {
  const confirmedPercentage = data.totalProjection > 0
    ? ((data.confirmedRevenue / data.totalProjection) * 100).toFixed(1)
    : '0.0';

  const pendingPercentage = data.totalProjection > 0
    ? ((data.pendingRevenue / data.totalProjection) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Total Projection Card */}
      <Card className="animate-fade-up-fast border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-blue-500" />
            <CardTitle>Proyección de Ingresos</CardTitle>
          </div>
          <CardDescription>
            {data.dateRange.startDate} a {data.dateRange.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">
            ${data.totalProjection.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Ingresos proyectados desde reservas futuras
          </p>
        </CardContent>
      </Card>

      {/* Breakdown Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Confirmed Revenue */}
        <Card className="animate-fade-left-normal">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">Ingresos Confirmados</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-green-600">
                ${data.confirmedRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                De {data.confirmedBookings} reserva{data.confirmedBookings !== 1 ? 's' : ''}{' '}
                confirmada{data.confirmedBookings !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${confirmedPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {confirmedPercentage}% del total proyectado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Revenue */}
        <Card className="animate-fade-right-normal">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FiClock className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Ingresos Pendientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-orange-600">
                ${data.pendingRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                De {data.pendingBookings} reserva{data.pendingBookings !== 1 ? 's' : ''}{' '}
                pendiente{data.pendingBookings !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${pendingPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {pendingPercentage}% del total proyectado
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Breakdown */}
      <Card className="animate-fade-up-slow">
        <CardHeader>
          <CardTitle>Desglose de Proyecciones</CardTitle>
          <CardDescription>Comparación de ingresos confirmados vs pendientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Stacked Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Distribución de Ingresos</span>
                <span className="font-semibold">${data.totalProjection.toLocaleString()}</span>
              </div>
              <div className="h-10 bg-muted rounded-md overflow-hidden flex">
                <div
                  className="h-full bg-green-500 flex items-center justify-center"
                  style={{ width: `${confirmedPercentage}%` }}
                >
                  {parseFloat(confirmedPercentage) > 15 && (
                    <span className="text-xs font-semibold text-white">
                      {confirmedPercentage}%
                    </span>
                  )}
                </div>
                <div
                  className="h-full bg-orange-500 flex items-center justify-center"
                  style={{ width: `${pendingPercentage}%` }}
                >
                  {parseFloat(pendingPercentage) > 15 && (
                    <span className="text-xs font-semibold text-white">
                      {pendingPercentage}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-sm" />
                  <span>Confirmados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                  <span>Pendientes</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Reservas</p>
                <p className="text-2xl font-bold">
                  {data.confirmedBookings + data.pendingBookings}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingreso Promedio</p>
                <p className="text-2xl font-bold">
                  ${((data.totalProjection / (data.confirmedBookings + data.pendingBookings)) || 0).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Future Outlook */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FiCalendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">Perspectiva</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.confirmedBookings > data.pendingBookings
                  ? 'La mayoría de las reservas están confirmadas, lo cual indica una alta certeza en los ingresos proyectados.'
                  : 'Hay más reservas pendientes que confirmadas. Se recomienda hacer seguimiento para confirmar los ingresos proyectados.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
