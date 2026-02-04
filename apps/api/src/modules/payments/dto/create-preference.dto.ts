// Create Payment Preference DTO
// Request body for creating a Mercado Pago payment preference

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePreferenceDto {
  @ApiProperty({
    description: 'Booking ID to create payment preference for',
    example: 'clx1234567890booking',
  })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.BOOKING_DEPOSIT,
  })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({
    description: 'Customer email for payment notification',
    example: 'juan@example.com',
  })
  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @ApiPropertyOptional({
    description: 'Customer name for payment',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  payerName?: string;

  @ApiPropertyOptional({
    description: 'Override amount (uses booking deposit/balance if not provided)',
    example: 2500.00,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Custom success URL (uses facility default if not provided)',
    example: 'https://myapp.com/payment/success',
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Custom failure URL (uses facility default if not provided)',
    example: 'https://myapp.com/payment/failure',
  })
  @IsOptional()
  @IsString()
  failureUrl?: string;
}
