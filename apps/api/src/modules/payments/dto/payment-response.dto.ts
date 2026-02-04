// Payment Response DTOs
// Response types for payment operations

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentType } from '@prisma/client';

export class PreferenceResponseDto {
  @ApiProperty({
    description: 'Internal payment record ID',
    example: 'clx1234567890payment',
  })
  id: string;

  @ApiProperty({
    description: 'Mercado Pago preference ID',
    example: '123456789-abcdef',
  })
  preferenceId: string;

  @ApiProperty({
    description: 'Payment checkout URL',
    example: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcdef',
  })
  initPoint: string;

  @ApiProperty({
    description: 'Sandbox payment checkout URL (for testing)',
    example: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcdef',
  })
  sandboxInitPoint: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 2500.00,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'ARS',
  })
  currency: string;

  @ApiProperty({
    description: 'Preference expiration date',
    example: '2026-02-03T12:30:00Z',
  })
  expiresAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: 'clx1234567890payment',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'clx1234567890tenant',
  })
  tenantId: string;

  @ApiPropertyOptional({
    description: 'Associated booking ID',
    example: 'clx1234567890booking',
  })
  bookingId?: string | null;

  @ApiPropertyOptional({
    description: 'Associated subscription ID',
    example: 'clx1234567890subscription',
  })
  subscriptionId?: string | null;

  @ApiPropertyOptional({
    description: 'Associated customer ID',
    example: 'clx1234567890customer',
  })
  customerId?: string | null;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.BOOKING_DEPOSIT,
  })
  type: PaymentType;

  @ApiProperty({
    description: 'Payment amount',
    example: 2500.00,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'ARS',
  })
  currency: string;

  @ApiPropertyOptional({
    description: 'Mercado Pago preference ID',
    example: '123456789-abcdef',
  })
  externalPreferenceId?: string | null;

  @ApiPropertyOptional({
    description: 'Mercado Pago payment ID',
    example: '987654321',
  })
  externalPaymentId?: string | null;

  @ApiPropertyOptional({
    description: 'External status from Mercado Pago',
    example: 'approved',
  })
  externalStatus?: string | null;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Payer email',
    example: 'juan@example.com',
  })
  payerEmail?: string | null;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'credit_card',
  })
  paymentMethod?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when webhook was received',
  })
  webhookReceivedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when payment was processed',
  })
  processedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Error message if payment failed',
    example: 'Card declined',
  })
  errorMessage?: string | null;

  @ApiProperty({
    description: 'Payment creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Payment last update timestamp',
  })
  updatedAt: Date;
}

export class PaymentStatusResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: 'clx1234567890payment',
  })
  id: string;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  @ApiPropertyOptional({
    description: 'External status from Mercado Pago',
    example: 'approved',
  })
  externalStatus?: string | null;

  @ApiProperty({
    description: 'Whether payment is fully completed',
    example: true,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: 'Whether payment is still pending',
    example: false,
  })
  isPending: boolean;

  @ApiProperty({
    description: 'Whether payment failed',
    example: false,
  })
  isFailed: boolean;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    example: null,
  })
  errorMessage?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when payment was completed',
  })
  completedAt?: Date | null;
}

export class PaymentListResponseDto {
  @ApiProperty({
    description: 'List of payments',
    type: [PaymentResponseDto],
  })
  items: PaymentResponseDto[];

  @ApiProperty({
    description: 'Total number of payments matching the query',
    example: 100,
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
