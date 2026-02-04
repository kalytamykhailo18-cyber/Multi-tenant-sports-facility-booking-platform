// Use Credit DTO
// Request body for applying credits to a booking

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';

export class UseCreditDto {
  @ApiProperty({
    description: 'Customer ID whose credits to use',
    example: 'clx1234567890customer',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Booking ID to apply credits to',
    example: 'clx1234567890booking',
  })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    description: 'Maximum amount to apply from credits',
    example: 2500.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Specific credit IDs to use (uses oldest first if not specified)',
    type: [String],
    example: ['credit1', 'credit2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  creditIds?: string[];
}

export class DeactivateCreditDto {
  @ApiPropertyOptional({
    description: 'Reason for deactivating the credit',
    example: 'Credit expired per customer request',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
