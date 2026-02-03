// Bookings Store
// Zustand store for booking and time slot state management

import { create } from 'zustand';
import {
  bookingsApi,
  timeSlotsApi,
  type Booking,
  type TimeSlot,
  type DaySlotsResponse,
  type QueryBookingParams,
  type CreateBookingRequest,
  type UpdateBookingRequest,
  type BookingStatus,
  type SlotLockResponse,
  type CourtInfo,
} from '@/lib/bookings-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
}

interface CalendarState {
  facilityId: string | null;
  selectedDate: string; // YYYY-MM-DD format
  daySlots: DaySlotsResponse | null;
  courts: CourtInfo[];
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  specialHoursReason?: string;
}

interface SlotLockState {
  lockToken: string | null;
  expiresAt: Date | null;
  lockedSlot: {
    courtId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
  } | null;
}

interface BookingsState {
  // Booking data
  bookings: Booking[];
  selectedBooking: Booking | null;
  pagination: PaginationState;

  // Calendar/time slot data
  calendar: CalendarState;
  slotLock: SlotLockState;

  // Loading states
  loading: boolean;
  loadingBooking: boolean;
  loadingSlots: boolean;
  creating: boolean;
  updating: boolean;
  cancelling: boolean;
  locking: boolean;

  // Error state
  error: string | null;

  // Booking actions
  loadBookings: (params?: QueryBookingParams) => Promise<void>;
  loadBookingsByDateRange: (facilityId: string, startDate: string, endDate: string) => Promise<void>;
  loadBooking: (id: string) => Promise<void>;
  createBooking: (data: CreateBookingRequest) => Promise<Booking>;
  updateBooking: (id: string, data: UpdateBookingRequest) => Promise<Booking>;
  cancelBooking: (id: string, reason?: string) => Promise<Booking>;
  changeBookingStatus: (id: string, status: BookingStatus) => Promise<Booking>;
  markBookingCompleted: (id: string) => Promise<Booking>;
  markBookingNoShow: (id: string) => Promise<Booking>;
  markBookingConfirmed: (id: string) => Promise<Booking>;
  setSelectedBooking: (booking: Booking | null) => void;

  // Calendar/time slot actions
  loadDaySlots: (facilityId: string, date: string, courtId?: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setCalendarFacility: (facilityId: string) => void;
  checkSlotAvailability: (courtId: string, date: string, startTime: string, durationMinutes?: number) => Promise<boolean>;
  lockSlot: (courtId: string, date: string, startTime: string, durationMinutes?: number) => Promise<SlotLockResponse>;
  unlockSlot: () => Promise<void>;

  // Utility actions
  clearError: () => void;
  clearBookings: () => void;
  clearCalendar: () => void;
  getSlotByTime: (courtId: string, startTime: string) => TimeSlot | undefined;

  // Socket event handlers
  handleBookingCreated: (booking: Partial<Booking>) => void;
  handleBookingUpdated: (booking: Partial<Booking>) => void;
  handleBookingCancelled: (data: { id: string; courtId: string; date: string }) => void;
  handleBookingStatusChanged: (data: { id: string; oldStatus: BookingStatus; newStatus: BookingStatus }) => void;
  handleSlotLocked: (data: { courtId: string; date: string; startTime: string }) => void;
  handleSlotUnlocked: (data: { courtId: string; date: string; startTime: string }) => void;
}

// Helper to get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  // Initial state
  bookings: [],
  selectedBooking: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
  },
  calendar: {
    facilityId: null,
    selectedDate: getTodayString(),
    daySlots: null,
    courts: [],
    isOpen: true,
    openTime: null,
    closeTime: null,
  },
  slotLock: {
    lockToken: null,
    expiresAt: null,
    lockedSlot: null,
  },
  loading: false,
  loadingBooking: false,
  loadingSlots: false,
  creating: false,
  updating: false,
  cancelling: false,
  locking: false,
  error: null,

  // ==========================================
  // Booking Actions
  // ==========================================

  loadBookings: async (params?: QueryBookingParams) => {
    set({ loading: true, error: null });
    try {
      const response = await bookingsApi.list(params);
      set({
        bookings: response.items,
        pagination: {
          total: response.total,
          page: response.page || 1,
          limit: response.limit || 20,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar reservas',
        loading: false,
      });
    }
  },

  loadBookingsByDateRange: async (facilityId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      const bookings = await bookingsApi.getByDateRange(facilityId, startDate, endDate);
      set({
        bookings,
        pagination: {
          total: bookings.length,
          page: 1,
          limit: bookings.length,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar reservas',
        loading: false,
      });
    }
  },

  loadBooking: async (id: string) => {
    set({ loadingBooking: true, error: null });
    try {
      const booking = await bookingsApi.getById(id);
      set({ selectedBooking: booking, loadingBooking: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar reserva',
        loadingBooking: false,
      });
    }
  },

  createBooking: async (data: CreateBookingRequest) => {
    set({ creating: true, error: null });
    try {
      // Include lock token from slotLock state if available (for race condition prevention)
      const { slotLock } = get();
      const bookingData: CreateBookingRequest = {
        ...data,
        // Include lockToken if we have one and it's not already in the data
        lockToken: data.lockToken ?? slotLock.lockToken ?? undefined,
      };

      const booking = await bookingsApi.create(bookingData);

      // Add to bookings list
      set((state) => ({
        bookings: [...state.bookings, booking],
        creating: false,
        // Clear slot lock after successful booking
        slotLock: {
          lockToken: null,
          expiresAt: null,
          lockedSlot: null,
        },
      }));

      // Refresh day slots if viewing the same date
      const { calendar } = get();
      if (calendar.facilityId && booking.date === calendar.selectedDate) {
        await get().loadDaySlots(calendar.facilityId, calendar.selectedDate);
      }

      return booking;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear reserva',
        creating: false,
      });
      throw error;
    }
  },

  updateBooking: async (id: string, data: UpdateBookingRequest) => {
    set({ updating: true, error: null });
    try {
      const booking = await bookingsApi.update(id, data);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        updating: false,
      }));

      // Refresh day slots
      const { calendar } = get();
      if (calendar.facilityId) {
        await get().loadDaySlots(calendar.facilityId, calendar.selectedDate);
      }

      return booking;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar reserva',
        updating: false,
      });
      throw error;
    }
  },

  cancelBooking: async (id: string, reason?: string) => {
    set({ cancelling: true, error: null });
    try {
      const booking = await bookingsApi.cancel(id, reason);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        cancelling: false,
      }));

      // Refresh day slots
      const { calendar } = get();
      if (calendar.facilityId) {
        await get().loadDaySlots(calendar.facilityId, calendar.selectedDate);
      }

      return booking;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cancelar reserva',
        cancelling: false,
      });
      throw error;
    }
  },

  changeBookingStatus: async (id: string, status: BookingStatus) => {
    set({ updating: true, error: null });
    try {
      const booking = await bookingsApi.changeStatus(id, status);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        updating: false,
      }));
      return booking;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cambiar estado',
        updating: false,
      });
      throw error;
    }
  },

  markBookingCompleted: async (id: string) => {
    return get().changeBookingStatus(id, 'COMPLETED');
  },

  markBookingNoShow: async (id: string) => {
    return get().changeBookingStatus(id, 'NO_SHOW');
  },

  markBookingConfirmed: async (id: string) => {
    return get().changeBookingStatus(id, 'CONFIRMED');
  },

  setSelectedBooking: (booking: Booking | null) => {
    set({ selectedBooking: booking });
  },

  // ==========================================
  // Calendar/Time Slot Actions
  // ==========================================

  loadDaySlots: async (facilityId: string, date: string, courtId?: string) => {
    set({ loadingSlots: true, error: null });
    try {
      const response = await timeSlotsApi.getDaySlots(facilityId, date, courtId);
      set({
        calendar: {
          facilityId,
          selectedDate: date,
          daySlots: response,
          courts: response.courts,
          isOpen: response.isOpen,
          openTime: response.openTime,
          closeTime: response.closeTime,
          specialHoursReason: response.specialHoursReason,
        },
        loadingSlots: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar horarios',
        loadingSlots: false,
      });
    }
  },

  setSelectedDate: (date: string) => {
    set((state) => ({
      calendar: {
        ...state.calendar,
        selectedDate: date,
      },
    }));

    // Reload slots for the new date if we have a facility
    const { calendar } = get();
    if (calendar.facilityId) {
      get().loadDaySlots(calendar.facilityId, date);
    }
  },

  setCalendarFacility: (facilityId: string) => {
    set((state) => ({
      calendar: {
        ...state.calendar,
        facilityId,
      },
    }));
  },

  checkSlotAvailability: async (courtId: string, date: string, startTime: string, durationMinutes?: number) => {
    try {
      const response = await timeSlotsApi.checkAvailability(courtId, date, startTime, durationMinutes);
      return response.available;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al verificar disponibilidad',
      });
      return false;
    }
  },

  lockSlot: async (courtId: string, date: string, startTime: string, durationMinutes?: number) => {
    set({ locking: true, error: null });
    try {
      const response = await timeSlotsApi.lockSlot(courtId, date, startTime, durationMinutes);
      set({
        slotLock: {
          lockToken: response.lockToken,
          expiresAt: new Date(response.expiresAt),
          lockedSlot: {
            courtId,
            date,
            startTime,
            durationMinutes: durationMinutes || 60,
          },
        },
        locking: false,
      });
      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al bloquear horario',
        locking: false,
      });
      throw error;
    }
  },

  unlockSlot: async () => {
    const { slotLock } = get();
    if (!slotLock.lockToken) return;

    try {
      await timeSlotsApi.unlockSlot(slotLock.lockToken);
      set({
        slotLock: {
          lockToken: null,
          expiresAt: null,
          lockedSlot: null,
        },
      });
    } catch (error) {
      // Log but don't throw - slot might have already expired
      console.warn('Error unlocking slot:', error);
    }
  },

  // ==========================================
  // Utility Actions
  // ==========================================

  clearError: () => {
    set({ error: null });
  },

  clearBookings: () => {
    set({
      bookings: [],
      selectedBooking: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
      },
    });
  },

  clearCalendar: () => {
    set({
      calendar: {
        facilityId: null,
        selectedDate: getTodayString(),
        daySlots: null,
        courts: [],
        isOpen: true,
        openTime: null,
        closeTime: null,
      },
    });
  },

  getSlotByTime: (courtId: string, startTime: string) => {
    const { calendar } = get();
    if (!calendar.daySlots) return undefined;
    return calendar.daySlots.slots.find(
      (slot) => slot.courtId === courtId && slot.startTime === startTime
    );
  },

  // ==========================================
  // Socket Event Handlers
  // ==========================================

  handleBookingCreated: (bookingData: Partial<Booking>) => {
    set((state) => {
      // Add to bookings list if we have full booking data
      if (bookingData.id) {
        const exists = state.bookings.some((b) => b.id === bookingData.id);
        if (!exists && bookingData as Booking) {
          return {
            bookings: [...state.bookings, bookingData as Booking],
          };
        }
      }
      return state;
    });

    // Refresh day slots if viewing the affected date
    const { calendar } = get();
    if (
      calendar.facilityId &&
      bookingData.date &&
      bookingData.date === calendar.selectedDate
    ) {
      get().loadDaySlots(calendar.facilityId, calendar.selectedDate);
    }
  },

  handleBookingUpdated: (bookingData: Partial<Booking>) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingData.id ? { ...b, ...bookingData } : b
      ),
      selectedBooking:
        state.selectedBooking?.id === bookingData.id
          ? { ...state.selectedBooking, ...bookingData }
          : state.selectedBooking,
    }));

    // Refresh day slots
    const { calendar } = get();
    if (calendar.facilityId) {
      get().loadDaySlots(calendar.facilityId, calendar.selectedDate);
    }
  },

  handleBookingCancelled: (data: { id: string; courtId: string; date: string }) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === data.id ? { ...b, status: 'CANCELLED' as BookingStatus } : b
      ),
      selectedBooking:
        state.selectedBooking?.id === data.id
          ? { ...state.selectedBooking, status: 'CANCELLED' as BookingStatus }
          : state.selectedBooking,
    }));

    // Refresh day slots if viewing the affected date
    const { calendar } = get();
    if (calendar.facilityId && data.date === calendar.selectedDate) {
      get().loadDaySlots(calendar.facilityId, calendar.selectedDate);
    }
  },

  handleBookingStatusChanged: (data: { id: string; oldStatus: BookingStatus; newStatus: BookingStatus }) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === data.id ? { ...b, status: data.newStatus } : b
      ),
      selectedBooking:
        state.selectedBooking?.id === data.id
          ? { ...state.selectedBooking, status: data.newStatus }
          : state.selectedBooking,
    }));
  },

  handleSlotLocked: (data: { courtId: string; date: string; startTime: string }) => {
    // Update slot in calendar to show as locked
    set((state) => {
      if (!state.calendar.daySlots) return state;

      const updatedSlots = state.calendar.daySlots.slots.map((slot) =>
        slot.courtId === data.courtId && slot.startTime === data.startTime
          ? { ...slot, isLocked: true, status: 'RESERVED' as BookingStatus }
          : slot
      );

      return {
        calendar: {
          ...state.calendar,
          daySlots: {
            ...state.calendar.daySlots,
            slots: updatedSlots,
          },
        },
      };
    });
  },

  handleSlotUnlocked: (data: { courtId: string; date: string; startTime: string }) => {
    // Update slot in calendar to show as available (if no booking)
    set((state) => {
      if (!state.calendar.daySlots) return state;

      const updatedSlots = state.calendar.daySlots.slots.map((slot) => {
        if (slot.courtId === data.courtId && slot.startTime === data.startTime) {
          // Only mark as available if there's no booking
          if (!slot.bookingId) {
            return { ...slot, isLocked: false, status: 'AVAILABLE' as BookingStatus };
          }
        }
        return slot;
      });

      return {
        calendar: {
          ...state.calendar,
          daySlots: {
            ...state.calendar.daySlots,
            slots: updatedSlots,
          },
        },
      };
    });
  },
}));
