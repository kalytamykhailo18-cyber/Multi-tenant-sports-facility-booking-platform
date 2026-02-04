// Customer Booking History Component
// Displays customer's booking history with actual booking records

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  bookingsApi,
  type Booking,
  type BookingStatus,
  getBookingStatusLabel,
  formatTime,
  formatPrice,
} from '@/lib/bookings-api';
import { formatDate } from '@/lib/customers-api';

interface CustomerBookingHistoryProps {
  customerId: string;
  customerPhone: string;
  totalBookings: number;
  completedBookings: number;
  noShowCount: number;
  cancellationCount: number;
}

// Status badge color mapping
function getStatusBadgeClass(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    AVAILABLE: 'bg-gray-100 text-gray-700',
    RESERVED: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

// Payment status display
function getPaymentStatus(booking: Booking): { label: string; className: string } {
  if (booking.balancePaid && booking.depositPaid) {
    return { label: 'Pagado completo', className: 'text-green-600' };
  }
  if (booking.depositPaid) {
    return { label: 'Seña pagada', className: 'text-blue-600' };
  }
  return { label: 'Sin pagar', className: 'text-muted-foreground' };
}

export function CustomerBookingHistory({
  customerPhone,
  totalBookings,
  completedBookings,
  noShowCount,
  cancellationCount,
}: CustomerBookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const loadBookings = useCallback(async (pageNum: number, append = false) => {
    if (!customerPhone) return;

    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.list({
        customerPhone,
        page: pageNum,
        limit,
        sortBy: 'date',
        sortOrder: 'desc',
      });

      if (append) {
        setBookings((prev) => [...prev, ...response.items]);
      } else {
        setBookings(response.items);
      }
      setTotalItems(response.total);
      setHasMore(response.items.length === limit && pageNum * limit < response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [customerPhone]);

  // Load initial bookings
  useEffect(() => {
    if (customerPhone) {
      setPage(1);
      loadBookings(1, false);
    }
  }, [customerPhone, loadBookings]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadBookings(nextPage, true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de Reservas</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-md">
            <p className="text-2xl font-bold">{totalBookings}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md">
            <p className="text-2xl font-bold text-green-600">{completedBookings}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-md">
            <p className="text-2xl font-bold text-red-600">{noShowCount}</p>
            <p className="text-xs text-muted-foreground">No shows</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-md">
            <p className="text-2xl font-bold text-yellow-600">{cancellationCount}</p>
            <p className="text-xs text-muted-foreground">Cancelaciones</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Loading state (initial load) */}
        {loading && bookings.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner size="default" />
          </div>
        )}

        {/* Empty state */}
        {!loading && bookings.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Este cliente no tiene reservas registradas</p>
          </div>
        )}

        {/* Booking list */}
        {bookings.length > 0 && (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const paymentStatus = getPaymentStatus(booking);
              return (
                <div
                  key={booking.id}
                  className="p-4 bg-muted/50 rounded-md border border-muted hover:bg-muted/70 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Date and time */}
                    <div className="flex-1">
                      <p className="font-medium">
                        {formatDate(booking.date)} - {formatTime(booking.startTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.courtName || `Cancha`} · {booking.durationMinutes} min
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(booking.status)}`}
                      >
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  {/* Payment and price info */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className={paymentStatus.className}>{paymentStatus.label}</span>
                    <span className="text-muted-foreground">
                      Total: {formatPrice(booking.totalPrice)}
                    </span>
                    {booking.depositAmount > 0 && (
                      <span className="text-muted-foreground">
                        Seña: {formatPrice(booking.depositAmount)}
                      </span>
                    )}
                  </div>

                  {/* Notes if present */}
                  {booking.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      {booking.notes}
                    </p>
                  )}

                  {/* Cancellation reason if cancelled */}
                  {booking.status === 'CANCELLED' && booking.cancellationReason && (
                    <p className="mt-2 text-sm text-destructive">
                      Motivo: {booking.cancellationReason}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Load more button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Cargando...
                    </>
                  ) : (
                    `Cargar más (${bookings.length} de ${totalItems})`
                  )}
                </Button>
              </div>
            )}

            {/* Results count */}
            {!hasMore && bookings.length > 0 && (
              <p className="text-sm text-center text-muted-foreground pt-2">
                Mostrando {bookings.length} de {totalItems} reservas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
