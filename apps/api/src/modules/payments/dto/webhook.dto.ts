// Mercado Pago Webhook DTOs
// Structures for processing Mercado Pago IPN notifications

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

/**
 * Mercado Pago IPN (Instant Payment Notification) payload
 * Reference: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/ipn
 */
export class MercadoPagoWebhookDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '12345678',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Whether this is a live notification',
    example: true,
  })
  @IsOptional()
  live_mode?: boolean;

  @ApiProperty({
    description: 'Type of notification (payment, merchant_order, etc.)',
    example: 'payment',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Date of creation',
    example: '2026-02-03T10:30:00.000-03:00',
  })
  @IsOptional()
  date_created?: string;

  @ApiProperty({
    description: 'Application ID',
    example: '5753956029335408',
  })
  @IsOptional()
  application_id?: string;

  @ApiPropertyOptional({
    description: 'User ID',
    example: '653243368',
  })
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'API version',
    example: 'v1',
  })
  @IsOptional()
  api_version?: string;

  @ApiProperty({
    description: 'Action type',
    example: 'payment.created',
  })
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'Data object containing the resource ID',
  })
  data: {
    id: string;
  };
}

/**
 * Mercado Pago Payment details (fetched after receiving webhook)
 * This represents the response from GET /v1/payments/:id
 */
export class MercadoPagoPaymentDto {
  @ApiProperty({ description: 'Payment ID', example: 123456789 })
  id: number;

  @ApiProperty({ description: 'Payment status', example: 'approved' })
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';

  @ApiProperty({ description: 'Status detail', example: 'accredited' })
  status_detail: string;

  @ApiProperty({ description: 'Transaction amount', example: 2500.00 })
  transaction_amount: number;

  @ApiProperty({ description: 'Currency ID', example: 'ARS' })
  currency_id: string;

  @ApiProperty({ description: 'Date approved', example: '2026-02-03T10:30:00.000-03:00' })
  date_approved?: string | null;

  @ApiProperty({ description: 'Date created', example: '2026-02-03T10:30:00.000-03:00' })
  date_created: string;

  @ApiProperty({ description: 'Date of expiration', example: '2026-02-03T10:30:00.000-03:00' })
  date_of_expiration?: string | null;

  @ApiProperty({ description: 'External reference (our booking/payment ID)' })
  external_reference?: string | null;

  @ApiProperty({ description: 'Payment method ID', example: 'master' })
  payment_method_id: string;

  @ApiProperty({ description: 'Payment type ID', example: 'credit_card' })
  payment_type_id: string;

  @ApiProperty({ description: 'Payer information' })
  payer: {
    id?: string;
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
    first_name?: string;
    last_name?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };

  @ApiProperty({ description: 'Preference ID' })
  preference_id?: string | null;

  @ApiPropertyOptional({ description: 'Collector ID (merchant)' })
  collector_id?: number;

  @ApiPropertyOptional({ description: 'Money release date' })
  money_release_date?: string | null;

  @ApiPropertyOptional({ description: 'Refunds' })
  refunds?: Array<{
    id: number;
    amount: number;
    status: string;
    date_created: string;
  }>;

  @ApiPropertyOptional({ description: 'Additional info' })
  additional_info?: {
    items?: Array<{
      id?: string;
      title?: string;
      description?: string;
      unit_price?: number;
      quantity?: number;
    }>;
  };
}

/**
 * Internal webhook processing result
 */
export class WebhookProcessingResultDto {
  @ApiProperty({
    description: 'Whether the webhook was processed successfully',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Payment record ID if created/updated',
    example: 'clx1234567890payment',
  })
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Booking ID if payment was for a booking',
    example: 'clx1234567890booking',
  })
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Message describing the result',
    example: 'Payment approved and booking updated',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Whether this was a duplicate notification (idempotency)',
    example: false,
  })
  isDuplicate?: boolean;
}

/**
 * Response when webhook is queued for async processing
 * Returned immediately to satisfy Mercado Pago's requirement for quick 200 response
 */
export class WebhookQueuedResponseDto {
  @ApiProperty({
    description: 'Acknowledgment that webhook was received',
    example: 'received',
  })
  status: 'received';

  @ApiPropertyOptional({
    description: 'Job ID for tracking the queued webhook',
    example: 'webhook-12345678',
  })
  jobId?: string;

  @ApiPropertyOptional({
    description: 'Additional message',
    example: 'Webhook queued for processing',
  })
  message?: string;
}
