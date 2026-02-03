// Bookings Hooks
// Custom hooks for booking and calendar management

'use client';

import { useCallback, useEffect } from 'react';
import { useBookingsStore } from '@/stores/bookings.store';
import { useUIStore, type BookingModalState } from '@/stores/ui.store';
import type {
  QueryBookingParams,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingStatus,
  Booking,
  TimeSlot,
} from '@/lib/bookings-api';

/**
 * Main hook for booking management
 * Provides all booking-related state and actions
 */
export function useBookings() {
  const {
    bookings,
    selectedBooking,
    pagination,
    loading,
    loadingBooking,
    creating,
    updating,
    cancelling,
    error,
    loadBookings,
    loadBookingsByDateRange,
    loadBooking,
    createBooking,
    updateBooking,
    cancelBooking,
    changeBookingStatus,
    markBookingCompleted,
    markBookingNoShow,
    markBookingConfirmed,
    setSelectedBooking,
    clearError,
    clearBookings,
    handleBookingCreated,
    handleBookingUpdated,
    handleBookingCancelled,
    handleBookingStatusChanged,
  } = useBookingsStore();

  // Memoized callbacks for stable references
  const handleLoadBookings = useCallback(
    (params?: QueryBookingParams) => loadBookings(params),
    [loadBookings],
  );

  const handleLoadBookingsByDateRange = useCallback(
    (facilityId: string, startDate: string, endDate: string) =>
      loadBookingsByDateRange(facilityId, startDate, endDate),
    [loadBookingsByDateRange],
  );

  const handleLoadBooking = useCallback(
    (id: string) => loadBooking(id),
    [loadBooking],
  );

  const handleCreateBooking = useCallback(
    (data: CreateBookingRequest) => createBooking(data),
    [createBooking],
  );

  const handleUpdateBooking = useCallback(
    (id: string, data: UpdateBookingRequest) => updateBooking(id, data),
    [updateBooking],
  );

  const handleCancelBooking = useCallback(
    (id: string, reason?: string) => cancelBooking(id, reason),
    [cancelBooking],
  );

  const handleChangeStatus = useCallback(
    (id: string, status: BookingStatus) => changeBookingStatus(id, status),
    [changeBookingStatus],
  );

  const handleSetSelectedBooking = useCallback(
    (booking: typeof selectedBooking) => setSelectedBooking(booking),
    [setSelectedBooking],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);
  const handleClearBookings = useCallback(() => clearBookings(), [clearBookings]);

  return {
    // State
    bookings,
    selectedBooking,
    pagination,
    loading,
    loadingBooking,
    creating,
    updating,
    cancelling,
    error,

    // Actions
    loadBookings: handleLoadBookings,
    loadBookingsByDateRange: handleLoadBookingsByDateRange,
    loadBooking: handleLoadBooking,
    createBooking: handleCreateBooking,
    updateBooking: handleUpdateBooking,
    cancelBooking: handleCancelBooking,
    changeStatus: handleChangeStatus,
    markCompleted: markBookingCompleted,
    markNoShow: markBookingNoShow,
    markConfirmed: markBookingConfirmed,
    setSelectedBooking: handleSetSelectedBooking,
    clearError: handleClearError,
    clearBookings: handleClearBookings,

    // Socket handlers
    handleBookingCreated,
    handleBookingUpdated,
    handleBookingCancelled,
    handleBookingStatusChanged,
  };
}

/**
 * Hook for calendar/time slot management
 * Provides calendar-specific state and actions
 */
export function useCalendar() {
  const {
    calendar,
    slotLock,
    loadingSlots,
    locking,
    error,
    loadDaySlots,
    setSelectedDate,
    setCalendarFacility,
    checkSlotAvailability,
    lockSlot,
    unlockSlot,
    getSlotByTime,
    clearCalendar,
    clearError,
    handleSlotLocked,
    handleSlotUnlocked,
  } = useBookingsStore();

  // Memoized callbacks
  const handleLoadDaySlots = useCallback(
    (facilityId: string, date: string, courtId?: string) =>
      loadDaySlots(facilityId, date, courtId),
    [loadDaySlots],
  );

  const handleSetSelectedDate = useCallback(
    (date: string) => setSelectedDate(date),
    [setSelectedDate],
  );

  const handleSetCalendarFacility = useCallback(
    (facilityId: string) => setCalendarFacility(facilityId),
    [setCalendarFacility],
  );

  const handleCheckAvailability = useCallback(
    (courtId: string, date: string, startTime: string, durationMinutes?: number) =>
      checkSlotAvailability(courtId, date, startTime, durationMinutes),
    [checkSlotAvailability],
  );

  const handleLockSlot = useCallback(
    (courtId: string, date: string, startTime: string, durationMinutes?: number) =>
      lockSlot(courtId, date, startTime, durationMinutes),
    [lockSlot],
  );

  const handleUnlockSlot = useCallback(() => unlockSlot(), [unlockSlot]);

  const handleGetSlotByTime = useCallback(
    (courtId: string, startTime: string) => getSlotByTime(courtId, startTime),
    [getSlotByTime],
  );

  const handleClearCalendar = useCallback(() => clearCalendar(), [clearCalendar]);
  const handleClearError = useCallback(() => clearError(), [clearError]);

  return {
    // State
    facilityId: calendar.facilityId,
    selectedDate: calendar.selectedDate,
    daySlots: calendar.daySlots,
    courts: calendar.courts,
    slots: calendar.daySlots?.slots || [],
    isOpen: calendar.isOpen,
    openTime: calendar.openTime,
    closeTime: calendar.closeTime,
    specialHoursReason: calendar.specialHoursReason,
    slotLock,
    loadingSlots,
    locking,
    error,

    // Actions
    loadDaySlots: handleLoadDaySlots,
    setSelectedDate: handleSetSelectedDate,
    setCalendarFacility: handleSetCalendarFacility,
    checkAvailability: handleCheckAvailability,
    lockSlot: handleLockSlot,
    unlockSlot: handleUnlockSlot,
    getSlotByTime: handleGetSlotByTime,
    clearCalendar: handleClearCalendar,
    clearError: handleClearError,

    // Socket handlers
    handleSlotLocked,
    handleSlotUnlocked,
  };
}

/**
 * Hook to auto-load bookings on mount
 */
export function useBookingsLoader(params?: QueryBookingParams) {
  const { loadBookings, bookings, loading, error, pagination } = useBookings();

  useEffect(() => {
    loadBookings(params);
  }, [
    loadBookings,
    params?.page,
    params?.limit,
    params?.facilityId,
    params?.courtId,
    params?.status,
    params?.startDate,
    params?.endDate,
    params?.search,
  ]);

  return { bookings, loading, error, pagination };
}

/**
 * Hook to auto-load bookings for a date range
 */
export function useBookingsByDateRange(
  facilityId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
) {
  const { loadBookingsByDateRange, bookings, loading, error, clearBookings } = useBookings();

  useEffect(() => {
    if (facilityId && startDate && endDate) {
      loadBookingsByDateRange(facilityId, startDate, endDate);
    } else {
      clearBookings();
    }
  }, [facilityId, startDate, endDate, loadBookingsByDateRange, clearBookings]);

  // Filter bookings by facilityId in case store has bookings from multiple facilities
  const facilityBookings = facilityId
    ? bookings.filter((b) => b.facilityId === facilityId)
    : bookings;

  return { bookings: facilityBookings, loading, error };
}

/**
 * Hook to auto-load calendar slots for a facility and date
 */
export function useCalendarSlots(
  facilityId: string | undefined,
  date: string | undefined,
  courtId?: string,
) {
  const {
    loadDaySlots,
    daySlots,
    courts,
    slots,
    isOpen,
    openTime,
    closeTime,
    specialHoursReason,
    loadingSlots,
    error,
    clearCalendar,
  } = useCalendar();

  useEffect(() => {
    if (facilityId && date) {
      loadDaySlots(facilityId, date, courtId);
    } else {
      clearCalendar();
    }
  }, [facilityId, date, courtId, loadDaySlots, clearCalendar]);

  return {
    daySlots,
    courts,
    slots,
    isOpen,
    openTime,
    closeTime,
    specialHoursReason,
    loading: loadingSlots,
    error,
  };
}

/**
 * Hook to load a single booking by ID
 */
export function useBookingById(id: string | undefined) {
  const { loadBooking, selectedBooking, loadingBooking, error } = useBookings();

  useEffect(() => {
    if (id) {
      loadBooking(id);
    }
  }, [id, loadBooking]);

  return { booking: selectedBooking, loading: loadingBooking, error };
}

/**
 * Hook for booking form operations (create/update)
 */
export function useBookingForm() {
  const { createBooking, updateBooking, creating, updating, error, clearError } = useBookings();

  const isSubmitting = creating || updating;

  const handleSubmit = useCallback(
    async (data: CreateBookingRequest | (UpdateBookingRequest & { id: string })) => {
      if ('id' in data && data.id) {
        const { id, ...updateData } = data;
        return updateBooking(id, updateData);
      }
      return createBooking(data as CreateBookingRequest);
    },
    [createBooking, updateBooking],
  );

  return {
    submit: handleSubmit,
    isSubmitting,
    error,
    clearError,
  };
}

/**
 * Hook for booking cancellation
 */
export function useBookingCancellation() {
  const { cancelBooking, cancelling, error, clearError } = useBookings();

  return {
    cancel: cancelBooking,
    isCancelling: cancelling,
    error,
    clearError,
  };
}

/**
 * Hook for booking status management
 */
export function useBookingStatus() {
  const {
    changeStatus,
    markCompleted,
    markNoShow,
    markConfirmed,
    updating,
    error,
  } = useBookings();

  return {
    changeStatus,
    markCompleted,
    markNoShow,
    markConfirmed,
    isUpdating: updating,
    error,
  };
}

/**
 * Hook for slot locking (used during booking creation)
 */
export function useSlotLock() {
  const {
    slotLock,
    lockSlot,
    unlockSlot,
    locking,
    error,
    clearError,
  } = useCalendar();

  const hasLock = !!slotLock.lockToken;
  const isExpired = slotLock.expiresAt ? new Date() > slotLock.expiresAt : false;

  return {
    lockToken: slotLock.lockToken,
    expiresAt: slotLock.expiresAt,
    lockedSlot: slotLock.lockedSlot,
    hasLock,
    isExpired,
    lockSlot,
    unlockSlot,
    isLocking: locking,
    error,
    clearError,
  };
}

/**
 * Hook for booking quick actions (complete, no-show, confirm)
 */
export function useBookingQuickActions() {
  const { markCompleted, markNoShow, markConfirmed, updating, error } = useBookings();

  const handleComplete = useCallback(
    async (id: string) => {
      await markCompleted(id);
    },
    [markCompleted],
  );

  const handleNoShow = useCallback(
    async (id: string) => {
      await markNoShow(id);
    },
    [markNoShow],
  );

  const handleConfirm = useCallback(
    async (id: string) => {
      await markConfirmed(id);
    },
    [markConfirmed],
  );

  return {
    markCompleted: handleComplete,
    markNoShow: handleNoShow,
    markConfirmed: handleConfirm,
    isUpdating: updating,
    error,
  };
}

/**
 * Options for opening booking modal
 */
interface BookingModalOptions {
  courtName?: string;
  facilityName?: string;
  currencyCode?: string;
  depositPercentage?: number;
}

/**
 * Hook for booking modal management
 * Provides methods to open/close the booking modal in different modes
 * and connects to the UI store for modal state
 */
export function useBookingModal() {
  const {
    bookingModal,
    openBookingModal,
    closeBookingModal,
    updateBookingModalData,
  } = useUIStore();

  // Open modal in view mode (for viewing booking details)
  const openViewModal = useCallback(
    (booking: Booking, options?: BookingModalOptions) => {
      openBookingModal({
        mode: 'view',
        booking,
        slot: null,
        courtName: options?.courtName || booking.courtName,
        facilityName: options?.facilityName || booking.facilityName,
        date: booking.date,
        currencyCode: options?.currencyCode,
        depositPercentage: options?.depositPercentage,
      });
    },
    [openBookingModal],
  );

  // Open modal in create mode (for creating new booking)
  const openCreateModal = useCallback(
    (slot: TimeSlot, options?: BookingModalOptions) => {
      openBookingModal({
        mode: 'create',
        booking: null,
        slot,
        courtName: options?.courtName || slot.courtName,
        facilityName: options?.facilityName,
        date: slot.date,
        currencyCode: options?.currencyCode,
        depositPercentage: options?.depositPercentage,
      });
    },
    [openBookingModal],
  );

  // Open modal in edit mode (for editing existing booking)
  const openEditModal = useCallback(
    (booking: Booking, options?: BookingModalOptions) => {
      openBookingModal({
        mode: 'edit',
        booking,
        slot: null,
        courtName: options?.courtName || booking.courtName,
        facilityName: options?.facilityName || booking.facilityName,
        date: booking.date,
        currencyCode: options?.currencyCode,
        depositPercentage: options?.depositPercentage,
      });
    },
    [openBookingModal],
  );

  // Close modal
  const closeModal = useCallback(() => {
    closeBookingModal();
  }, [closeBookingModal]);

  // Update modal data without changing open/close state
  const updateModalData = useCallback(
    (data: Partial<BookingModalState>) => {
      updateBookingModalData(data);
    },
    [updateBookingModalData],
  );

  return {
    // Modal state
    isOpen: bookingModal.isOpen,
    mode: bookingModal.mode,
    booking: bookingModal.booking,
    slot: bookingModal.slot,
    courtName: bookingModal.courtName,
    facilityName: bookingModal.facilityName,
    date: bookingModal.date,
    currencyCode: bookingModal.currencyCode,
    depositPercentage: bookingModal.depositPercentage,

    // Actions
    openViewModal,
    openCreateModal,
    openEditModal,
    closeModal,
    updateModalData,
  };
}
