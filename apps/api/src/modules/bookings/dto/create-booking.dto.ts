// Create Booking DTO
// Validation for creating a new booking

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  Matches,
  IsIn,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Court ID to book',
    example: 'clx1234567890court',
  })
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @ApiProperty({
    description: 'Booking date in YYYY-MM-DD format',
    example: '2026-02-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '18:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    description: 'Duration in minutes (60 or 90)',
    example: 60,
  })
  @IsInt()
  @IsIn([60, 90, 120], {
    message: 'durationMinutes must be 60, 90, or 120',
  })
  durationMinutes: number;

  @ApiProperty({
    description: 'Customer name',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    description: 'Customer phone number (WhatsApp)',
    example: '+5491155551234',
  })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({
    description: 'Customer email address',
    example: 'juan@example.com',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Internal notes about the booking',
    example: 'Cliente VIP, darle la mejor cancha disponible',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether the deposit is already paid (for manual bookings)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  depositPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the full amount is already paid (for manual bookings)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  fullyPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Optional total price override (calculated automatically if not provided)',
    example: 5000.00,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPriceOverride?: number;

  @ApiPropertyOptional({
    description: 'Lock token from slot locking (required for online bookings to prevent race conditions)',
    example: 'lock_abc123xyz',
  })
  @IsOptional()
  @IsString()
  lockToken?: string;
}
