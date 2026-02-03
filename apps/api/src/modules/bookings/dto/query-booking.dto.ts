// Query Booking DTO
// Validation for querying bookings with filters and pagination

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class QueryBookingDto {
  @ApiPropertyOptional({
    description: 'Facility ID to filter bookings',
    example: 'clx1234567890facility',
  })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({
    description: 'Court ID to filter bookings',
    example: 'clx1234567890court',
  })
  @IsOptional()
  @IsString()
  courtId?: string;

  @ApiPropertyOptional({
    description: 'Start date for date range filter (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for date range filter (YYYY-MM-DD)',
    example: '2026-02-28',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: 'PAID',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by multiple statuses',
    type: [String],
    example: ['RESERVED', 'PAID', 'CONFIRMED'],
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: BookingStatus[];

  @ApiPropertyOptional({
    description: 'Filter by customer phone',
    example: '+5491155551234',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Search by customer name',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by deposit payment status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  depositPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by full payment status',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  fullyPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'date',
    default: 'date',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'date';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

// Query for time slots
export class QueryTimeSlotsDto {
  @ApiPropertyOptional({
    description: 'Facility ID (required)',
    example: 'clx1234567890facility',
  })
  @IsString()
  facilityId: string;

  @ApiPropertyOptional({
    description: 'Date for slots (YYYY-MM-DD)',
    example: '2026-02-15',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Filter by specific court',
    example: 'clx1234567890court',
  })
  @IsOptional()
  @IsString()
  courtId?: string;
}

// Lock slot request
export class LockSlotDto {
  @ApiPropertyOptional({
    description: 'Court ID',
    example: 'clx1234567890court',
  })
  @IsString()
  courtId: string;

  @ApiPropertyOptional({
    description: 'Booking date (YYYY-MM-DD)',
    example: '2026-02-15',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Start time (HH:mm)',
    example: '18:00',
  })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 60,
  })
  @IsInt()
  @IsOptional()
  durationMinutes?: number = 60;
}

// Unlock slot request
export class UnlockSlotDto {
  @ApiPropertyOptional({
    description: 'Lock token to release',
    example: 'lock_abc123xyz',
  })
  @IsString()
  lockToken: string;
}
