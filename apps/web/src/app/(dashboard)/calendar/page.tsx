// Calendar Page
// Main booking calendar view for facility owners and staff

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserFacility } from '@/hooks/useFacilities';
import { useCalendar, useBookings, useSlotLock, useBookingModal } from '@/hooks/useBookings';
import { useBookingEvents, useSocketEvent, SOCKET_EVENTS } from '@/hooks/useSocket';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BookingGrid } from '@/components/calendar/BookingGrid';
import { ConnectedBookingModal } from '@/components/calendar/BookingModal';
import type { TimeSlot, Booking } from '@/lib/bookings-api';

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user's facility
  const { selectedFacility, loadUserFacility, loading: loadingFacility } = useUserFacility();

  // Calendar state
  const {
    facilityId,
    selectedDate,
    daySlots,
    loadingSlots,
    error: calendarError,
    loadDaySlots,
    setSelectedDate,
    setCalendarFacility,
    clearError: clearCalendarError,
    handleSlotLocked,
    handleSlotUnlocked,
  } = useCalendar();

  // Get booking socket handlers
  const {
    handleBookingCreated,
    handleBookingUpdated,
    handleBookingCancelled,
    handleBookingStatusChanged,
  } = useBookings();

  // Subscribe to real-time booking events
  useBookingEvents({
    onCreated: handleBookingCreated,
    onUpdated: handleBookingUpdated,
    onCancelled: handleBookingCancelled,
    onStatusChanged: handleBookingStatusChanged,
  });

  // Subscribe to slot lock/unlock events for real-time calendar updates
  useSocketEvent(SOCKET_EVENTS.SLOT_LOCKED, handleSlotLocked);
  useSocketEvent(SOCKET_EVENTS.SLOT_UNLOCKED, handleSlotUnlocked);

  // Slot locking for race condition prevention
  const { lockSlot, isLocking } = useSlotLock();

  // Booking modal - uses UI store for state management
  const { openViewModal, openCreateModal } = useBookingModal();

  // Load user's facility on mount
  useEffect(() => {
    if (user?.tenantId) {
      loadUserFacility();
    }
  }, [user?.tenantId, loadUserFacility]);

  // Set calendar facility when loaded
  useEffect(() => {
    if (selectedFacility?.id && !facilityId) {
      setCalendarFacility(selectedFacility.id);
      loadDaySlots(selectedFacility.id, selectedDate);
    }
  }, [selectedFacility?.id, facilityId, selectedDate, setCalendarFacility, loadDaySlots]);

  // Handle date change
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (facilityId) {
      loadDaySlots(facilityId, selectedDate);
    }
  }, [facilityId, selectedDate, loadDaySlots]);

  // Handle slot click - with slot locking for race condition prevention
  const handleSlotClick = useCallback(async (slot: TimeSlot) => {
    if (slot.status === 'AVAILABLE' && !slot.isLocked) {
      try {
        // Lock the slot before opening the create modal (prevents race conditions)
        await lockSlot(
          slot.courtId,
          slot.date,
          slot.startTime,
          slot.durationMinutes,
        );

        // Open create modal after successful lock (via UI store)
        openCreateModal(slot, {
          facilityName: selectedFacility?.name,
          currencyCode: selectedFacility?.currencyCode,
          depositPercentage: selectedFacility?.depositPercentage,
        });
      } catch (error) {
        // Show error if slot is already being reserved
        toast({
          title: 'Horario no disponible',
          description: error instanceof Error
            ? error.message
            : 'Este horario está siendo reservado por otro usuario. Intenta con otro horario.',
          variant: 'destructive',
        });
        // Refresh slots to show updated availability
        handleRefresh();
      }
    } else if (slot.booking) {
      // Open view modal with booking details (no lock needed for viewing)
      openViewModal(slot.booking, {
        courtName: slot.courtName,
        facilityName: selectedFacility?.name,
        currencyCode: selectedFacility?.currencyCode,
        depositPercentage: selectedFacility?.depositPercentage,
      });
    }
  }, [lockSlot, toast, handleRefresh, openCreateModal, openViewModal, selectedFacility]);

  // Handle booking created callback - show toast
  const handleBookingCreatedCallback = useCallback((booking: Booking) => {
    toast({
      title: 'Reserva creada',
      description: 'La reserva se ha creado correctamente.',
    });
  }, [toast]);

  // Handle booking updated callback - show toast
  const handleBookingUpdatedCallback = useCallback((booking: Booking) => {
    toast({
      title: 'Reserva actualizada',
      description: 'La reserva se ha actualizado correctamente.',
    });
  }, [toast]);

  // Handle booking cancelled callback - show toast
  const handleBookingCancelledCallback = useCallback((bookingId: string) => {
    toast({
      title: 'Reserva cancelada',
      description: 'La reserva se ha cancelado correctamente.',
    });
  }, [toast]);

  // Drag and drop state for booking movement
  const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);

  // Handle drag start for moving bookings
  const handleDragStart = useCallback((slot: TimeSlot) => {
    if (slot.booking) {
      setDraggedSlot(slot);
    }
  }, []);

  // Handle drop for moving bookings to a new slot
  const handleDrop = useCallback(async (targetSlot: TimeSlot) => {
    if (!draggedSlot || !draggedSlot.booking) {
      setDraggedSlot(null);
      return;
    }

    // Don't allow drop on the same slot
    if (
      draggedSlot.courtId === targetSlot.courtId &&
      draggedSlot.startTime === targetSlot.startTime
    ) {
      setDraggedSlot(null);
      return;
    }

    try {
      // Update booking with new court/time
      const { bookingsApi } = await import('@/lib/bookings-api');
      await bookingsApi.update(draggedSlot.booking.id, {
        courtId: targetSlot.courtId,
        date: targetSlot.date,
        startTime: targetSlot.startTime,
      });

      toast({
        title: 'Reserva movida',
        description: `Reserva movida a ${targetSlot.courtName} - ${targetSlot.startTime}`,
      });

      handleRefresh();
    } catch (error) {
      toast({
        title: 'Error al mover reserva',
        description: error instanceof Error ? error.message : 'No se pudo mover la reserva',
        variant: 'destructive',
      });
    } finally {
      setDraggedSlot(null);
    }
  }, [draggedSlot, toast, handleRefresh]);

  // Super Admin - show facility selector message
  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Como Super Admin, debes seleccionar una instalación para ver su calendario.
            </p>
            <Button onClick={() => router.push('/facilities')}>
              Ver Instalaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading facility
  if (loadingFacility) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // No facility found
  if (!selectedFacility) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No se encontró una instalación asociada a tu cuenta.
            </p>
            <p className="text-sm text-muted-foreground">
              Contacta al administrador si crees que esto es un error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendario de Reservas</h1>
          <p className="text-muted-foreground">{selectedFacility.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/bookings')}
          >
            Ver Lista
          </Button>
          <Button onClick={() => {
            // Get first available slot for today
            const availableSlot = daySlots?.slots.find(
              s => s.status === 'AVAILABLE' && !s.isLocked
            );
            if (availableSlot) {
              handleSlotClick(availableSlot);
            } else {
              toast({
                title: 'Sin horarios',
                description: 'No hay horarios disponibles para crear una reserva.',
                variant: 'destructive',
              });
            }
          }}>
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {calendarError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive flex items-center justify-between">
          <span>{calendarError}</span>
          <Button variant="ghost" size="sm" onClick={clearCalendarError}>
            Cerrar
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      <BookingGrid
        facilityId={facilityId || selectedFacility.id}
        selectedDate={selectedDate}
        daySlots={daySlots}
        loading={loadingSlots || isLocking}
        error={calendarError}
        onSlotClick={handleSlotClick}
        onSlotDragStart={handleDragStart}
        onSlotDrop={handleDrop}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        showPrices={true}
        currencyCode={selectedFacility.currencyCode}
      />

      {/* Quick Stats - Responsive grid */}
      {daySlots && daySlots.isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:pt-4 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {daySlots.slots.filter(s => s.status === 'AVAILABLE' && !s.isLocked).length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:pt-4 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                {daySlots.slots.filter(s => ['PAID', 'CONFIRMED'].includes(s.status)).length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Confirmadas</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:pt-4 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {daySlots.slots.filter(s => s.status === 'RESERVED').length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:pt-4 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold">
                {daySlots.courts.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Canchas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Modal - Connected to UI store */}
      <ConnectedBookingModal
        onBookingCreated={handleBookingCreatedCallback}
        onBookingUpdated={handleBookingUpdatedCallback}
        onBookingCancelled={handleBookingCancelledCallback}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
