// Subscription Response DTO
// Response format for subscription data

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'Unique subscription ID',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'clx0987654321fedcba',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Standard',
  })
  planName: string;

  @ApiProperty({
    description: 'Price amount',
    example: 15000,
  })
  priceAmount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'ARS',
  })
  currency: string;

  @ApiProperty({
    description: 'Billing cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'Current period start date',
    example: '2024-02-01T00:00:00.000Z',
  })
  currentPeriodStart: Date;

  @ApiProperty({
    description: 'Current period end date',
    example: '2024-03-01T00:00:00.000Z',
  })
  currentPeriodEnd: Date;

  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Next payment due date',
    example: '2024-03-01T00:00:00.000Z',
  })
  nextPaymentDate: Date;

  @ApiPropertyOptional({
    description: 'Last payment date',
    example: '2024-02-01T00:00:00.000Z',
  })
  lastPaymentDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Last payment amount',
    example: 15000,
  })
  lastPaymentAmount?: number | null;

  @ApiProperty({
    description: 'Days before due date to show DUE_SOON status',
    example: 5,
  })
  dueSoonDays: number;

  @ApiProperty({
    description: 'Days until next payment',
    example: 15,
  })
  daysUntilDue: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-02-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-02-01T12:00:00.000Z',
  })
  updatedAt: Date;

  // Related tenant info
  @ApiPropertyOptional({
    description: 'Tenant business name',
    example: 'Canchas Los Amigos',
  })
  tenantName?: string;
}

export class SubscriptionListResponseDto {
  @ApiProperty({
    description: 'List of subscriptions',
    type: [SubscriptionResponseDto],
  })
  items: SubscriptionResponseDto[];

  @ApiProperty({
    description: 'Total number of subscriptions matching the query',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}
