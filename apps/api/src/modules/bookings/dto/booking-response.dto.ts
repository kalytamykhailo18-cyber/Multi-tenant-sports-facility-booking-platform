// Booking Response DTOs
// Response types for booking endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking unique identifier',
    example: 'clx1234567890booking',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'clx1234567890tenant',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  facilityId: string;

  @ApiProperty({
    description: 'Court ID',
    example: 'clx1234567890court',
  })
  courtId: string;

  @ApiProperty({
    description: 'Booking date',
    example: '2026-02-15',
  })
  date: Date;

  @ApiProperty({
    description: 'Start time',
    example: '18:00',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time',
    example: '19:00',
  })
  endTime: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 60,
  })
  durationMinutes: number;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: 'RESERVED',
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Customer name',
    example: 'Juan Pérez',
  })
  customerName: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+5491155551234',
  })
  customerPhone: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'juan@example.com',
  })
  customerEmail: string | null;

  @ApiProperty({
    description: 'Total price',
    example: 5000.00,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Deposit amount',
    example: 2500.00,
  })
  depositAmount: number;

  @ApiProperty({
    description: 'Whether deposit is paid',
    example: false,
  })
  depositPaid: boolean;

  @ApiPropertyOptional({
    description: 'Date when deposit was paid',
    example: '2026-02-14T10:30:00.000Z',
  })
  depositPaidAt: Date | null;

  @ApiProperty({
    description: 'Balance amount remaining',
    example: 2500.00,
  })
  balanceAmount: number;

  @ApiProperty({
    description: 'Whether balance is paid',
    example: false,
  })
  balancePaid: boolean;

  @ApiPropertyOptional({
    description: 'Date when balance was paid',
    example: null,
  })
  balancePaidAt: Date | null;

  @ApiPropertyOptional({
    description: 'Internal notes',
    example: 'Cliente VIP',
  })
  notes: string | null;

  @ApiPropertyOptional({
    description: 'Date when booking was cancelled',
    example: null,
  })
  cancelledAt: Date | null;

  @ApiPropertyOptional({
    description: 'Cancellation reason',
    example: null,
  })
  cancellationReason: string | null;

  @ApiPropertyOptional({
    description: 'Date when no-show was marked',
    example: null,
  })
  noShowMarkedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Date when customer confirmed attendance',
    example: null,
  })
  confirmedAt: Date | null;

  @ApiProperty({
    description: 'Date when booking was created',
    example: '2026-02-14T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when booking was last updated',
    example: '2026-02-14T10:30:00.000Z',
  })
  updatedAt: Date;

  // Computed/joined fields
  @ApiPropertyOptional({
    description: 'Court name',
    example: 'Cancha 1',
  })
  courtName?: string;

  @ApiPropertyOptional({
    description: 'Facility name',
    example: 'Complejo Los Amigos',
  })
  facilityName?: string;

  @ApiPropertyOptional({
    description: 'Created by user name',
    example: 'Admin User',
  })
  createdByName?: string;

  @ApiPropertyOptional({
    description: 'Formatted date for display',
    example: '15 de Febrero',
  })
  formattedDate?: string;

  @ApiPropertyOptional({
    description: 'Status display label in Spanish',
    example: 'Reservado',
  })
  statusLabel?: string;
}

// Paginated bookings response
export class BookingListResponseDto {
  @ApiProperty({
    description: 'List of bookings',
    type: [BookingResponseDto],
  })
  items: BookingResponseDto[];

  @ApiProperty({
    description: 'Total count of bookings matching the query',
    example: 50,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  limit?: number;
}

// Time slot response for calendar
export class TimeSlotResponseDto {
  @ApiProperty({
    description: 'Court ID',
    example: 'clx1234567890court',
  })
  courtId: string;

  @ApiProperty({
    description: 'Court name',
    example: 'Cancha 1',
  })
  courtName: string;

  @ApiProperty({
    description: 'Slot date',
    example: '2026-02-15',
  })
  date: string;

  @ApiProperty({
    description: 'Slot start time',
    example: '18:00',
  })
  startTime: string;

  @ApiProperty({
    description: 'Slot end time',
    example: '19:00',
  })
  endTime: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 60,
  })
  durationMinutes: number;

  @ApiProperty({
    description: 'Whether the slot is available',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Slot status',
    enum: BookingStatus,
    example: 'AVAILABLE',
  })
  status: BookingStatus;

  @ApiPropertyOptional({
    description: 'Booking ID if slot is booked',
    example: 'clx1234567890booking',
  })
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Booking details if slot is booked',
    type: BookingResponseDto,
  })
  booking?: BookingResponseDto;

  @ApiProperty({
    description: 'Price for this slot',
    example: 5000.00,
  })
  price: number;

  @ApiProperty({
    description: 'Whether the slot is currently locked by another user',
    example: false,
  })
  isLocked: boolean;
}

// Day slots response
export class DaySlotsResponseDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  facilityId: string;

  @ApiProperty({
    description: 'Date for these slots',
    example: '2026-02-15',
  })
  date: string;

  @ApiProperty({
    description: 'Whether the facility is open on this day',
    example: true,
  })
  isOpen: boolean;

  @ApiPropertyOptional({
    description: 'Opening time (null if closed)',
    example: '08:00',
  })
  openTime: string | null;

  @ApiPropertyOptional({
    description: 'Closing time (null if closed)',
    example: '23:00',
  })
  closeTime: string | null;

  @ApiPropertyOptional({
    description: 'Reason if special hours apply',
    example: 'Feriado Nacional',
  })
  specialHoursReason?: string;

  @ApiProperty({
    description: 'All slots for all courts on this day',
    type: [TimeSlotResponseDto],
  })
  slots: TimeSlotResponseDto[];

  @ApiProperty({
    description: 'Courts available on this day',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        sportType: { type: 'string' },
        basePricePerHour: { type: 'number' },
      },
    },
  })
  courts: Array<{
    id: string;
    name: string;
    sportType: string;
    basePricePerHour: number;
  }>;
}

// Slot lock response
export class SlotLockResponseDto {
  @ApiProperty({
    description: 'Lock token for completing the booking',
    example: 'lock_abc123xyz',
  })
  lockToken: string;

  @ApiProperty({
    description: 'Lock expiration time',
    example: '2026-02-14T10:35:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Duration of lock in seconds',
    example: 300,
  })
  durationSeconds: number;
}

// Cancellation result with credit info
export class CancellationResultDto {
  @ApiProperty({
    description: 'Cancelled booking details',
    type: BookingResponseDto,
  })
  booking: BookingResponseDto;

  @ApiProperty({
    description: 'Whether the deposit was converted to credit (>24 hours before)',
    example: true,
  })
  depositConvertedToCredit: boolean;

  @ApiPropertyOptional({
    description: 'Credit ID if deposit was converted to credit',
    example: 'clx1234567890credit',
  })
  creditId?: string;

  @ApiPropertyOptional({
    description: 'Credit amount if deposit was converted',
    example: 2500.00,
  })
  creditAmount?: number;

  @ApiProperty({
    description: 'Whether the deposit was forfeited (<24 hours before)',
    example: false,
  })
  depositForfeited: boolean;

  @ApiPropertyOptional({
    description: 'Explanation message about the cancellation result',
    example: 'Deposit converted to credit: $2500',
  })
  message?: string;
}
