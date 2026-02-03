// Create Subscription DTO
// Validation for creating a new subscription

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Tenant ID for the subscription',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiPropertyOptional({
    description: 'Plan name',
    example: 'Standard',
    default: 'Standard',
  })
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiProperty({
    description: 'Monthly price amount',
    example: 15000,
  })
  @IsNumber()
  @Min(0)
  priceAmount: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'ARS',
    default: 'ARS',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Billing cycle',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({
    description: 'Days before due date to show DUE_SOON status',
    example: 5,
    default: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dueSoonDays?: number;

  @ApiPropertyOptional({
    description: 'Start date of subscription (defaults to now)',
    example: '2024-02-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
