// Dashboard Stats Cards Component
// Displays key statistics in card format

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { DashboardStats } from '@/lib/dashboard-api';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cargando...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'Reservas Hoy',
      value: stats.today.bookingsCount.toString(),
      subtitle: `${stats.today.confirmedCount} confirmadas`,
      highlight: stats.today.pendingConfirmationCount > 0
        ? `${stats.today.pendingConfirmationCount} pendientes`
        : null,
      highlightColor: 'text-yellow-600',
    },
    {
      title: 'Ingresos Esperados Hoy',
      value: formatCurrency(stats.today.expectedRevenue, stats.today.currency),
      subtitle: 'En reservas confirmadas',
    },
    {
      title: 'Reservas Esta Semana',
      value: stats.week.bookingsCount.toString(),
      subtitle: formatCurrency(stats.week.revenue, stats.week.currency),
    },
    {
      title: 'Tasa de Cancelación',
      value: formatPercentage(stats.cancellationRate),
      subtitle: 'Últimos 30 días',
      highlightColor: stats.cancellationRate > 20 ? 'text-red-600' : 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.highlightColor || ''}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
            {card.highlight && (
              <p className={`text-xs mt-1 ${card.highlightColor || 'text-muted-foreground'}`}>
                {card.highlight}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface QuickStatsProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function QuickStats({ stats, loading }: QuickStatsProps) {
  if (loading || !stats) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="font-medium">{stats.courtCount}</span>
        <span>Canchas activas</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{stats.activeCustomers}</span>
        <span>Clientes activos</span>
      </div>
      {stats.pendingEscalations > 0 && (
        <div className="flex items-center gap-2 text-yellow-600">
          <span className="font-medium">{stats.pendingEscalations}</span>
          <span>Escalaciones pendientes</span>
        </div>
      )}
    </div>
  );
}
