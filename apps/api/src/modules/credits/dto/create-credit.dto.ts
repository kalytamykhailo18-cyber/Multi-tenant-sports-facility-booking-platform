// Create Credit DTO
// Request body for creating a manual credit

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { CreditReason } from '@prisma/client';

export class CreateCreditDto {
  @ApiProperty({
    description: 'Customer ID to give credit to',
    example: 'clx1234567890customer',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Credit amount',
    example: 2500.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code (defaults to facility currency)',
    example: 'ARS',
    default: 'ARS',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Reason for the credit',
    enum: CreditReason,
    example: CreditReason.MANUAL,
  })
  @IsEnum(CreditReason)
  reason: CreditReason;

  @ApiPropertyOptional({
    description: 'Source booking ID (if credit is from cancellation)',
    example: 'clx1234567890booking',
  })
  @IsOptional()
  @IsString()
  sourceBookingId?: string;

  @ApiPropertyOptional({
    description: 'Source payment ID (if credit is from refund)',
    example: 'clx1234567890payment',
  })
  @IsOptional()
  @IsString()
  sourcePaymentId?: string;

  @ApiPropertyOptional({
    description: 'Description or notes about the credit',
    example: 'Customer credit for cancelled booking due to weather',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Expiration date for the credit (ISO date string)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
