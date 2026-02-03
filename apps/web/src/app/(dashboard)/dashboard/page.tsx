// Dashboard Home Page
// Facility Owner Dashboard with stats, alerts, and upcoming bookings

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  StatsCards,
  QuickStats,
  AlertsList,
  AlertsBanner,
  UpcomingBookings,
  SubscriptionStatus,
  SubscriptionBanner,
} from '@/components/dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    stats,
    alerts,
    upcoming,
    loadingStats,
    loadingAlerts,
    loadingUpcoming,
    isLoading,
    error,
    loadAll,
    clearError,
  } = useDashboard();

  // Load all dashboard data on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Determine if user is Owner/Staff (shows full dashboard) or Super Admin
  const isFacilityUser = user?.role === 'OWNER' || user?.role === 'STAFF';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Super Admin view (simplified)
  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, {user?.fullName}</CardTitle>
            <CardDescription>
              Panel de administración de Sports Booking - Super Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="text-lg font-semibold">{user?.role}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{user?.email}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Acceso</p>
                <p className="text-lg font-semibold">Todas las instalaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/facilities'}
              >
                <span className="text-2xl">🏟️</span>
                <span>Gestionar Instalaciones</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/subscriptions'}
              >
                <span className="text-2xl">💳</span>
                <span>Suscripciones</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/tenants'}
              >
                <span className="text-2xl">👥</span>
                <span>Tenants</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Facility Owner/Staff view
  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Cerrar
          </Button>
        </div>
      )}

      {/* Subscription Banner (if suspended) */}
      {stats && <SubscriptionBanner subscription={stats.subscription} />}

      {/* Urgent Alerts Banner */}
      <AlertsBanner alerts={alerts} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Bienvenido, {user?.fullName}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button onClick={() => loadAll()}>
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loadingStats} />

      {/* Quick Stats Row */}
      <QuickStats stats={stats} loading={loadingStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Column */}
        <div className="lg:col-span-1">
          <AlertsList alerts={alerts} loading={loadingAlerts} maxItems={5} />
        </div>

        {/* Upcoming Bookings Column */}
        <div className="lg:col-span-2">
          <UpcomingBookings bookings={upcoming} loading={loadingUpcoming} maxItems={5} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Subscription Status */}
        <SubscriptionStatus subscription={stats?.subscription || null} />

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = '/calendar'}
            >
              📅 Ver Calendario
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = '/customers'}
            >
              👥 Clientes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = '/finances'}
            >
              💰 Finanzas
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for future widgets */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumen de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size="lg" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{stats.week.bookingsCount}</p>
                  <p className="text-sm text-muted-foreground">Reservas esta semana</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: stats.week.currency,
                      maximumFractionDigits: 0,
                    }).format(stats.week.revenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">Ingresos esta semana</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Sin datos disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
