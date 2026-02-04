// Credit Response DTOs
// Response types for credit operations

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditReason } from '@prisma/client';

export class CreditResponseDto {
  @ApiProperty({
    description: 'Credit ID',
    example: 'clx1234567890credit',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'clx1234567890tenant',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Customer ID',
    example: 'clx1234567890customer',
  })
  customerId: string;

  @ApiProperty({
    description: 'Original credit amount',
    example: 2500.00,
  })
  originalAmount: number;

  @ApiProperty({
    description: 'Remaining credit balance',
    example: 1500.00,
  })
  remainingAmount: number;

  @ApiProperty({
    description: 'Amount used from this credit',
    example: 1000.00,
  })
  usedAmount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'ARS',
  })
  currency: string;

  @ApiProperty({
    description: 'Credit reason',
    enum: CreditReason,
    example: CreditReason.EARLY_CANCELLATION,
  })
  reason: CreditReason;

  @ApiPropertyOptional({
    description: 'Source booking ID',
    example: 'clx1234567890booking',
  })
  sourceBookingId?: string | null;

  @ApiPropertyOptional({
    description: 'Source payment ID',
    example: 'clx1234567890payment',
  })
  sourcePaymentId?: string | null;

  @ApiPropertyOptional({
    description: 'Credit description',
    example: 'Credit from early cancellation',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Booking IDs where this credit was used',
    type: [String],
    example: ['booking1', 'booking2'],
  })
  usedInBookingIds: string[];

  @ApiPropertyOptional({
    description: 'Credit expiration date',
  })
  expiresAt?: Date | null;

  @ApiProperty({
    description: 'Whether the credit has expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Whether the credit is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'User ID who created the credit',
    example: 'clx1234567890user',
  })
  createdById?: string | null;

  @ApiProperty({
    description: 'Credit creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Credit last update timestamp',
  })
  updatedAt: Date;
}

export class CreditListResponseDto {
  @ApiProperty({
    description: 'List of credits',
    type: [CreditResponseDto],
  })
  items: CreditResponseDto[];

  @ApiProperty({
    description: 'Total number of credits matching the query',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;
}

export class CustomerCreditBalanceDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'clx1234567890customer',
  })
  customerId: string;

  @ApiProperty({
    description: 'Total available credit balance',
    example: 5000.00,
  })
  totalBalance: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'ARS',
  })
  currency: string;

  @ApiProperty({
    description: 'Number of active credits',
    example: 3,
  })
  activeCreditsCount: number;

  @ApiProperty({
    description: 'List of active credits',
    type: [CreditResponseDto],
  })
  credits: CreditResponseDto[];
}

export class ApplyCreditResultDto {
  @ApiProperty({
    description: 'Whether the credit was successfully applied',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Amount applied from credits',
    example: 2000.00,
  })
  amountApplied: number;

  @ApiProperty({
    description: 'Remaining amount to pay after credits',
    example: 500.00,
  })
  remainingToPay: number;

  @ApiProperty({
    description: 'Credits used in this transaction',
    type: [String],
    example: ['credit1', 'credit2'],
  })
  creditsUsed: string[];

  @ApiPropertyOptional({
    description: 'Message with details',
    example: 'Applied $2000 from 2 credits',
  })
  message?: string;
}
