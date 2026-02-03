// Bookings API Functions
// Frontend API client for booking and time slot management

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export type BookingStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PAID'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Booking {
  id: string;
  tenantId: string;
  facilityId: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt: string | null;
  balanceAmount: number;
  balancePaid: boolean;
  balancePaidAt: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  noShowMarkedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed/joined fields
  courtName?: string;
  facilityName?: string;
  createdByName?: string;
  formattedDate?: string;
  statusLabel?: string;
}

export interface BookingListResponse {
  items: Booking[];
  total: number;
  page?: number;
  limit?: number;
}

export interface CreateBookingRequest {
  courtId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  depositPaid?: boolean;
  fullyPaid?: boolean;
  totalPriceOverride?: number;
  /** Lock token from slot locking (for race condition prevention in online bookings) */
  lockToken?: string;
}

export interface UpdateBookingRequest {
  courtId?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  depositPaid?: boolean;
  balancePaid?: boolean;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface ChangeStatusRequest {
  status: BookingStatus;
}

export interface QueryBookingParams {
  facilityId?: string;
  courtId?: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  statuses?: BookingStatus[];
  customerPhone?: string;
  search?: string;
  depositPaid?: boolean;
  fullyPaid?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'startTime' | 'createdAt' | 'customerName';
  sortOrder?: 'asc' | 'desc';
}

// Time Slot Types
export interface TimeSlot {
  courtId: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAvailable: boolean;
  status: BookingStatus;
  bookingId?: string;
  booking?: Booking;
  price: number;
  isLocked: boolean;
}

export interface CourtInfo {
  id: string;
  name: string;
  sportType: string;
  basePricePerHour: number;
}

export interface DaySlotsResponse {
  facilityId: string;
  date: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  specialHoursReason?: string;
  slots: TimeSlot[];
  courts: CourtInfo[];
}

export interface SlotLockResponse {
  lockToken: string;
  expiresAt: string;
  durationSeconds: number;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  reason?: string;
}

export interface ValidateLockResponse {
  valid: boolean;
  lockData?: {
    courtId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
  };
}

// ============================================
// Bookings API Functions
// ============================================

export const bookingsApi = {
  /**
   * Get paginated list of bookings
   */
  async list(params?: QueryBookingParams): Promise<BookingListResponse> {
    return apiClient.get<BookingListResponse>('/bookings', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get bookings for a facility within a date range
   */
  async getByDateRange(
    facilityId: string,
    startDate: string,
    endDate: string,
  ): Promise<Booking[]> {
    return apiClient.get<Booking[]>(`/bookings/facility/${facilityId}/range`, {
      params: { startDate, endDate },
    });
  },

  /**
   * Get booking by ID
   */
  async getById(id: string): Promise<Booking> {
    return apiClient.get<Booking>(`/bookings/${id}`);
  },

  /**
   * Create a new booking
   */
  async create(data: CreateBookingRequest): Promise<Booking> {
    return apiClient.post<Booking>('/bookings', data);
  },

  /**
   * Update a booking
   */
  async update(id: string, data: UpdateBookingRequest): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}`, data);
  },

  /**
   * Cancel a booking
   */
  async cancel(id: string, reason?: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/cancel`, { reason });
  },

  /**
   * Change booking status
   */
  async changeStatus(id: string, status: BookingStatus): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}/status`, { status });
  },

  /**
   * Mark booking as completed
   */
  async markCompleted(id: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/complete`);
  },

  /**
   * Mark booking as no-show
   */
  async markNoShow(id: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/no-show`);
  },

  /**
   * Mark booking as confirmed
   */
  async markConfirmed(id: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/confirm`);
  },
};

// ============================================
// Time Slots API Functions
// ============================================

export const timeSlotsApi = {
  /**
   * Get all time slots for a facility on a specific date
   */
  async getDaySlots(
    facilityId: string,
    date: string,
    courtId?: string,
  ): Promise<DaySlotsResponse> {
    return apiClient.get<DaySlotsResponse>('/time-slots', {
      params: { facilityId, date, courtId },
    });
  },

  /**
   * Check if a specific slot is available
   */
  async checkAvailability(
    courtId: string,
    date: string,
    startTime: string,
    durationMinutes?: number,
  ): Promise<CheckAvailabilityResponse> {
    return apiClient.get<CheckAvailabilityResponse>('/time-slots/check-availability', {
      params: { courtId, date, startTime, durationMinutes },
    });
  },

  /**
   * Lock a slot for payment
   */
  async lockSlot(
    courtId: string,
    date: string,
    startTime: string,
    durationMinutes?: number,
  ): Promise<SlotLockResponse> {
    return apiClient.post<SlotLockResponse>('/time-slots/lock', {
      courtId,
      date,
      startTime,
      durationMinutes,
    });
  },

  /**
   * Unlock a previously locked slot
   */
  async unlockSlot(lockToken: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/time-slots/unlock', { lockToken });
  },

  /**
   * Validate a lock token
   */
  async validateLock(lockToken: string): Promise<ValidateLockResponse> {
    return apiClient.get<ValidateLockResponse>('/time-slots/validate-lock', {
      params: { lockToken },
    });
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get display label for booking status
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    AVAILABLE: 'Disponible',
    RESERVED: 'Reservado',
    PAID: 'Pagado (seña)',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'No se presentó',
  };
  return labels[status] || status;
}

/**
 * Get color variant for booking status
 */
export function getBookingStatusVariant(
  status: BookingStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  const variants: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
    AVAILABLE: 'outline',
    RESERVED: 'secondary',
    PAID: 'default',
    CONFIRMED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'destructive',
    NO_SHOW: 'warning',
  };
  return variants[status] || 'outline';
}

/**
 * Get background color class for booking status (for calendar slots)
 */
export function getBookingStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    AVAILABLE: 'bg-green-100 hover:bg-green-200 border-green-300',
    RESERVED: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
    PAID: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    CONFIRMED: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300',
    COMPLETED: 'bg-gray-100 hover:bg-gray-200 border-gray-300',
    CANCELLED: 'bg-red-100 hover:bg-red-200 border-red-300',
    NO_SHOW: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Get text color class for booking status
 */
export function getBookingStatusTextColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    AVAILABLE: 'text-green-700',
    RESERVED: 'text-yellow-700',
    PAID: 'text-blue-700',
    CONFIRMED: 'text-emerald-700',
    COMPLETED: 'text-gray-700',
    CANCELLED: 'text-red-700',
    NO_SHOW: 'text-orange-700',
  };
  return colors[status] || 'text-gray-700';
}

/**
 * Format time for display (HH:mm -> H:mm AM/PM)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currencyCode = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currencyCode,
  }).format(price);
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Check if a booking can be cancelled
 */
export function canCancelBooking(booking: Booking): boolean {
  return !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status);
}

/**
 * Check if a booking can be marked as completed
 */
export function canCompleteBooking(booking: Booking): boolean {
  return ['PAID', 'CONFIRMED'].includes(booking.status);
}

/**
 * Check if a booking can be marked as no-show
 */
export function canMarkNoShow(booking: Booking): boolean {
  return ['PAID', 'CONFIRMED'].includes(booking.status);
}

/**
 * Group slots by court for calendar grid display
 */
export function groupSlotsByCourt(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const grouped = new Map<string, TimeSlot[]>();

  for (const slot of slots) {
    const courtSlots = grouped.get(slot.courtId) || [];
    courtSlots.push(slot);
    grouped.set(slot.courtId, courtSlots);
  }

  return grouped;
}
