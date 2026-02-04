// Payments Controller
// REST API endpoints for payment management

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { PaymentReconciliationJob } from './jobs/payment-reconciliation.job';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { PreferenceResponseDto, PaymentResponseDto, PaymentStatusResponseDto, PaymentListResponseDto } from './dto/payment-response.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly reconciliationJob: PaymentReconciliationJob,
  ) {}

  /**
   * Create a Mercado Pago payment preference for a booking
   */
  @Post('preference')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Create payment preference',
    description:
      'Creates a Mercado Pago payment preference for a booking. Returns a checkout URL for the customer to complete payment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment preference created successfully',
    type: PreferenceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or payment amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 500, description: 'Failed to create payment link (Mercado Pago error)' })
  async createPreference(@Body() dto: CreatePreferenceDto): Promise<PreferenceResponseDto> {
    return this.paymentsService.createPreference(dto);
  }

  /**
   * Get all payments with pagination and filters
   */
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'List payments',
    description: 'Get all payments for the current tenant with pagination and filtering options.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    type: PaymentListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - tenant context required' })
  async findAll(@Query() query: QueryPaymentDto): Promise<PaymentListResponseDto> {
    return this.paymentsService.findAll(query);
  }

  /**
   * Get a single payment by ID
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieve a specific payment record by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment found',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findById(@Param('id') id: string): Promise<PaymentResponseDto> {
    return this.paymentsService.findById(id);
  }

  /**
   * Get payment status
   */
  @Get(':id/status')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get payment status',
    description:
      'Get the current status of a payment including completion, pending, and failure indicators.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getStatus(@Param('id') id: string): Promise<PaymentStatusResponseDto> {
    return this.paymentsService.getPaymentStatus(id);
  }

  /**
   * Refresh payment status from Mercado Pago
   */
  @Post(':id/refresh')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Refresh payment status',
    description:
      'Fetches the latest payment status from Mercado Pago and updates the local record. Useful for reconciliation or when webhooks are delayed.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment status refreshed',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refreshStatus(@Param('id') id: string): Promise<PaymentStatusResponseDto> {
    return this.paymentsService.refreshPaymentStatus(id);
  }

  /**
   * Get payments for a specific booking
   */
  @Get('booking/:bookingId')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get payments for booking',
    description: 'Retrieve all payments associated with a specific booking.',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    type: [PaymentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - tenant context required' })
  async getPaymentsForBooking(@Param('bookingId') bookingId: string): Promise<PaymentResponseDto[]> {
    return this.paymentsService.getPaymentsForBooking(bookingId);
  }

  /**
   * Trigger manual reconciliation of all pending payments
   * Only available to Super Admin and Owners
   */
  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({
    summary: 'Trigger payment reconciliation',
    description:
      'Manually triggers the payment reconciliation job to check pending payments with Mercado Pago. ' +
      'This is useful when webhooks may have been missed or for debugging purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation completed',
    schema: {
      type: 'object',
      properties: {
        checked: { type: 'number', description: 'Number of payments checked' },
        updated: { type: 'number', description: 'Number of payments updated' },
        completed: { type: 'number', description: 'Number of payments now completed' },
        failed: { type: 'number', description: 'Number of payments now failed' },
        errors: { type: 'number', description: 'Number of errors during reconciliation' },
        stale: { type: 'number', description: 'Number of stale payments (pending too long)' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only Super Admin and Owners can trigger reconciliation' })
  async triggerReconciliation(): Promise<{
    checked: number;
    updated: number;
    completed: number;
    failed: number;
    errors: number;
    stale: number;
  }> {
    return this.reconciliationJob.triggerManualReconciliation();
  }

  /**
   * Reconcile a specific payment by ID
   */
  @Post(':id/reconcile')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({
    summary: 'Reconcile specific payment',
    description:
      'Checks a specific payment with Mercado Pago and updates its status. ' +
      'Useful for manually reconciling individual payments.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment reconciled',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'boolean', description: 'Whether the payment was updated' },
        newStatus: { type: 'string', description: 'New payment status (if updated)' },
        message: { type: 'string', description: 'Result message' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only Super Admin and Owners can reconcile' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async reconcilePayment(@Param('id') id: string): Promise<{
    updated: boolean;
    newStatus?: string;
    message: string;
  }> {
    return this.reconciliationJob.reconcilePayment(id);
  }
}
