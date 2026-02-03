// Booking related types
// These will be expanded when we implement the Booking model

import type { Court, Facility, SportType, CourtStatus, FacilityStatus } from '@sports-booking/database';
import type { BookingStatus } from '../constants';

// Time slot for calendar display
export interface TimeSlot {
  id: string;
  courtId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  status: BookingStatus;
  bookingId?: string;
  customerName?: string;
  customerPhone?: string;
}

// Calendar view data
export interface CalendarDay {
  date: string;
  courts: {
    court: Court;
    slots: TimeSlot[];
  }[];
}

// Booking creation input
export interface CreateBookingInput {
  courtId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  date: string;
  startTime: string;
  durationMinutes: 60 | 90;
  notes?: string;
}

// Court with pricing for display
export interface CourtWithPricing extends Court {
  effectivePrice: number;
  isPeakHour: boolean;
}

// Facility summary for listing
export interface FacilitySummary {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  courtsCount: number;
  status: FacilityStatus;
}

// Court summary for listing
export interface CourtSummary {
  id: string;
  facilityId: string;
  name: string;
  sportType: SportType;
  status: CourtStatus;
  basePricePerHour: number;
  isIndoor: boolean;
}

// Duration options for bookings
export type BookingDuration = 60 | 90 | 120;

// Time range for operating hours
export interface TimeRange {
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
}

// Weekly operating hours
export interface WeeklySchedule {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}
