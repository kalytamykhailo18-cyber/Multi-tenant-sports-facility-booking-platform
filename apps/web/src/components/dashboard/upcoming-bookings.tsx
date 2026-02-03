// Dashboard Upcoming Bookings Component
// Displays next upcoming bookings

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { UpcomingBooking } from '@/lib/dashboard-api';

interface UpcomingBookingsProps {
  bookings: UpcomingBooking[];
  loading?: boolean;
  maxItems?: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  RESERVED: { label: 'Reservado', variant: 'secondary' },
  PAID: { label: 'Pagado', variant: 'default' },
  CONFIRMED: { label: 'Confirmado', variant: 'default' },
  COMPLETED: { label: 'Completado', variant: 'outline' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  NO_SHOW: { label: 'No se presentó', variant: 'destructive' },
};

export function UpcomingBookings({ bookings, loading, maxItems = 5 }: UpcomingBookingsProps) {
  const router = useRouter();

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }

    return date.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Reservas</CardTitle>
          <CardDescription>Reservas próximas a comenzar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Reservas</CardTitle>
          <CardDescription>Reservas próximas a comenzar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-lg mb-2">Sin reservas próximas</p>
            <p className="text-sm">No hay reservas programadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedBookings = bookings.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Próximas Reservas</CardTitle>
            <CardDescription>Reservas próximas a comenzar</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/calendar')}
          >
            Ver Calendario
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedBookings.map((booking) => {
          const status = statusConfig[booking.status] || { label: booking.status, variant: 'secondary' as const };

          return (
            <div
              key={booking.id}
              className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/bookings/${booking.id}`)}
            >
              {/* Time and Date */}
              <div className="text-center min-w-[70px]">
                <p className="text-lg font-bold">{formatTime(booking.startTime)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(booking.date)}</p>
              </div>

              {/* Booking Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{booking.customerName}</p>
                  <Badge variant={status.variant} className="text-xs shrink-0">
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{booking.courtName}</span>
                  <span>•</span>
                  <span>{booking.durationMinutes} min</span>
                  {!booking.depositPaid && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-600">Sin seña</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(booking.totalPrice, booking.currency)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface TodaysScheduleProps {
  bookings: UpcomingBooking[];
  loading?: boolean;
}

export function TodaysSchedule({ bookings, loading }: TodaysScheduleProps) {
  const today = new Date();
  const todaysBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date);
    return bookingDate.toDateString() === today.toDateString();
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todaysBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sin reservas para hoy</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoy</CardTitle>
        <CardDescription>{todaysBookings.length} reservas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {todaysBookings.map((booking) => (
            <div key={booking.id} className="flex items-center gap-2 text-sm">
              <span className="font-mono font-medium">
                {booking.startTime.substring(0, 5)}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className="truncate">{booking.customerName}</span>
              <span className="text-muted-foreground">({booking.courtName})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
