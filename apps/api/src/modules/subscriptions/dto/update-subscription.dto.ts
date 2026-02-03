// Update Subscription DTO
// Validation for updating an existing subscription

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Plan name',
    example: 'Premium',
  })
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiPropertyOptional({
    description: 'Monthly price amount',
    example: 20000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'ARS',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Billing cycle',
    enum: BillingCycle,
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({
    description: 'Subscription status (for manual override)',
    enum: SubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Days before due date to show DUE_SOON status',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dueSoonDays?: number;
}
