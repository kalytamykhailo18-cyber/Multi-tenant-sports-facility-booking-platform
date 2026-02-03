// Update Booking DTO
// Validation for updating an existing booking

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Matches,
  IsIn,
  IsBoolean,
  IsEmail,
  IsNumber,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'Move to different court',
    example: 'clx1234567890court2',
  })
  @IsOptional()
  @IsString()
  courtId?: string;

  @ApiPropertyOptional({
    description: 'Reschedule date in YYYY-MM-DD format',
    example: '2026-02-16',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Reschedule start time in HH:mm format',
    example: '19:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Change duration in minutes',
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @IsIn([60, 90, 120], {
    message: 'durationMinutes must be 60, 90, or 120',
  })
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Update customer name',
    example: 'Juan Carlos Pérez',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Update customer phone',
    example: '+5491155559999',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Update customer email',
    example: 'juancarlos@example.com',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Update internal notes',
    example: 'Cambió el número de teléfono',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Mark deposit as paid',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  depositPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Mark balance as paid',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  balancePaid?: boolean;
}

// DTO for cancelling a booking
export class CancelBookingDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Cliente pidió cancelar por motivos personales',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO for changing booking status
export class ChangeBookingStatusDto {
  @ApiPropertyOptional({
    description: 'New booking status',
    enum: BookingStatus,
    example: 'CONFIRMED',
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
