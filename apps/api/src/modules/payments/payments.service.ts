// Payments Service
// Full payment management operations with Mercado Pago integration

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../common/audit/audit.types';
import { WsGateway } from '../../common/gateway/ws.gateway';
import { MercadoPagoOAuthService } from './oauth/oauth.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { PreferenceResponseDto, PaymentResponseDto, PaymentStatusResponseDto, PaymentListResponseDto } from './dto/payment-response.dto';
import { MercadoPagoWebhookDto, MercadoPagoPaymentDto, WebhookProcessingResultDto } from './dto/webhook.dto';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';

// Map Mercado Pago status to internal PaymentStatus
const MP_STATUS_MAP: Record<string, PaymentStatus> = {
  pending: PaymentStatus.PENDING,
  in_process: PaymentStatus.PROCESSING,
  authorized: PaymentStatus.PROCESSING,
  approved: PaymentStatus.COMPLETED,
  in_mediation: PaymentStatus.PROCESSING,
  rejected: PaymentStatus.FAILED,
  cancelled: PaymentStatus.CANCELLED,
  refunded: PaymentStatus.REFUNDED,
  charged_back: PaymentStatus.REFUNDED,
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly defaultMpConfig: MercadoPagoConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
    private readonly oauthService: MercadoPagoOAuthService,
  ) {
    // Initialize default Mercado Pago config (for subscriptions or fallback)
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (accessToken) {
      this.defaultMpConfig = new MercadoPagoConfig({ accessToken });
    }
  }

  /**
   * Get Mercado Pago config for a specific facility (OAuth tokens)
   * NOTE: Uses OAuth access token from Mercado Pago OAuth flow
   * Automatically handles decryption and token refresh if expired
   */
  private async getMercadoPagoConfig(facilityId: string): Promise<MercadoPagoConfig> {
    try {
      // Get decrypted access token (auto-refreshes if expired)
      const accessToken = await this.oauthService.getAccessToken(facilityId);

      return new MercadoPagoConfig({ accessToken });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get Mercado Pago config for facility ${facilityId}: ${errorMessage}`);

      // Re-throw with user-friendly message
      if (errorMessage.includes('not connected')) {
        throw new BadRequestException(
          'Mercado Pago is not connected for this facility. Please connect via OAuth in facility settings.'
        );
      }

      throw new BadRequestException(
        `Failed to get Mercado Pago credentials: ${errorMessage}`
      );
    }
  }

  /**
   * Create a Mercado Pago payment preference for a booking
   */
  async createPreference(dto: CreatePreferenceDto): Promise<PreferenceResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        facility: true,
        court: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    if (booking.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot create payment for booking from another tenant');
    }

    // Determine amount based on payment type
    let amount: number;
    if (dto.amount !== undefined) {
      amount = dto.amount;
    } else if (dto.type === PaymentType.BOOKING_DEPOSIT) {
      amount = Number(booking.depositAmount);
    } else if (dto.type === PaymentType.BOOKING_BALANCE) {
      amount = Number(booking.balanceAmount);
    } else {
      throw new BadRequestException('Amount is required for this payment type');
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    // Get Mercado Pago config for the facility
    const mpConfig = await this.getMercadoPagoConfig(booking.facilityId);
    const preferenceClient = new Preference(mpConfig);

    // Generate idempotency key
    const idempotencyKey = `${dto.bookingId}_${dto.type}_${Date.now()}`;

    // Create payment record first
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        bookingId: booking.id,
        type: dto.type,
        amount: new Decimal(amount),
        currency: booking.facility.currencyCode,
        status: PaymentStatus.PENDING,
        payerEmail: dto.payerEmail,
        payerName: dto.payerName,
        idempotencyKey,
      },
    });

    // Build preference items
    const items = [
      {
        id: payment.id,
        title: `${dto.type === PaymentType.BOOKING_DEPOSIT ? 'Seña' : 'Pago'} - ${booking.facility.name}`,
        description: `${booking.court.name} - ${booking.date.toISOString().split('T')[0]} ${booking.startTime}`,
        quantity: 1,
        currency_id: booking.facility.currencyCode,
        unit_price: amount,
      },
    ];

    // Build URLs
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const successUrl = dto.successUrl || `${frontendUrl}/payment/success?payment=${payment.id}`;
    const failureUrl = dto.failureUrl || `${frontendUrl}/payment/failure?payment=${payment.id}`;
    const pendingUrl = `${frontendUrl}/payment/pending?payment=${payment.id}`;

    // Build notification URL (webhook)
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    const notificationUrl = `${apiUrl}/api/v1/webhooks/mercadopago`;

    try {
      // Create Mercado Pago preference
      const preferenceResponse = await preferenceClient.create({
        body: {
          items,
          external_reference: payment.id,
          back_urls: {
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl,
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          payer: dto.payerEmail
            ? {
                email: dto.payerEmail,
                name: dto.payerName || booking.customerName,
              }
            : undefined,
        },
      });

      // Update payment with preference ID
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalPreferenceId: preferenceResponse.id,
        },
      });

      // Log audit event
      this.auditService.log({
        category: AuditEventCategory.PAYMENT,
        eventType: AuditEventType.PAYMENT_INITIATED,
        tenantId,
        actor: { type: 'SYSTEM', id: null },
        action: `Payment preference created for booking ${booking.id}`,
        entity: { type: 'PAYMENT', id: payment.id },
        metadata: {
          bookingId: booking.id,
          amount,
          type: dto.type,
          preferenceId: preferenceResponse.id,
        },
      });

      this.logger.log(`Payment preference created: ${payment.id} - ${preferenceResponse.id}`);

      return {
        id: payment.id,
        preferenceId: preferenceResponse.id || '',
        initPoint: preferenceResponse.init_point || '',
        sandboxInitPoint: preferenceResponse.sandbox_init_point || '',
        amount,
        currency: booking.facility.currencyCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };
    } catch (error) {
      // Update payment with error
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.logger.error(`Failed to create payment preference: ${error}`);
      throw new InternalServerErrorException('Failed to create payment link');
    }
  }

  /**
   * Process Mercado Pago webhook notification
   * Returns 200 immediately and processes asynchronously
   */
  async processWebhook(payload: MercadoPagoWebhookDto): Promise<WebhookProcessingResultDto> {
    this.logger.log(`Webhook received: ${payload.type} - ${payload.data?.id}`);

    // Only process payment notifications
    if (payload.type !== 'payment') {
      return { success: true, message: 'Notification type not processed' };
    }

    const externalPaymentId = payload.data?.id;
    if (!externalPaymentId) {
      return { success: false, message: 'No payment ID in webhook' };
    }

    try {
      // Fetch payment details from Mercado Pago
      const mpPayment = await this.fetchMercadoPagoPayment(externalPaymentId);
      if (!mpPayment) {
        return { success: false, message: 'Could not fetch payment from Mercado Pago' };
      }

      // Find our payment record by external reference (our payment ID)
      const paymentId = mpPayment.external_reference;
      if (!paymentId) {
        this.logger.warn(`No external reference in payment ${externalPaymentId}`);
        return { success: false, message: 'No external reference in payment' };
      }

      // Idempotency check - see if we already processed this
      const existingPayment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!existingPayment) {
        return { success: false, message: 'Payment record not found' };
      }

      // Check if already processed with this external payment ID
      if (existingPayment.externalPaymentId === String(externalPaymentId)) {
        return {
          success: true,
          paymentId,
          isDuplicate: true,
          message: 'Payment already processed',
        };
      }

      // Map status
      const newStatus = MP_STATUS_MAP[mpPayment.status] || PaymentStatus.PROCESSING;

      // Update payment record
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          externalPaymentId: String(mpPayment.id),
          externalStatus: mpPayment.status,
          status: newStatus,
          payerEmail: mpPayment.payer?.email,
          payerName: [mpPayment.payer?.first_name, mpPayment.payer?.last_name]
            .filter(Boolean)
            .join(' ') || undefined,
          paymentMethod: mpPayment.payment_type_id,
          webhookReceivedAt: new Date(),
          processedAt: newStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
        },
        include: { },
      });

      // If payment completed, update the booking
      let bookingId: string | undefined;
      if (newStatus === PaymentStatus.COMPLETED && updatedPayment.bookingId) {
        bookingId = updatedPayment.bookingId;
        await this.handlePaymentCompleted(updatedPayment);
      }

      // Emit socket event
      if (updatedPayment.tenantId) {
        this.wsGateway.emitToTenant(updatedPayment.tenantId, 'payment:updated', {
          id: updatedPayment.id,
          bookingId: updatedPayment.bookingId,
          status: newStatus,
        });
      }

      // Log audit event
      this.auditService.log({
        category: AuditEventCategory.PAYMENT,
        eventType: AuditEventType.PAYMENT_WEBHOOK_PROCESSED,
        tenantId: updatedPayment.tenantId,
        actor: { type: 'SYSTEM', id: null },
        action: `Payment ${newStatus}: ${paymentId}`,
        entity: { type: 'PAYMENT', id: paymentId },
        metadata: {
          externalPaymentId,
          status: newStatus,
          externalStatus: mpPayment.status,
        },
      });

      this.logger.log(`Payment processed: ${paymentId} - ${newStatus}`);

      return {
        success: true,
        paymentId,
        bookingId,
        message: `Payment ${newStatus.toLowerCase()}`,
      };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error}`);
      return { success: false, message: error instanceof Error ? error.message : 'Processing error' };
    }
  }

  /**
   * Fetch payment details from Mercado Pago API
   */
  private async fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPaymentDto | null> {
    try {
      // Use default config for fetching - we don't know which facility yet
      if (!this.defaultMpConfig) {
        throw new Error('Mercado Pago not configured');
      }

      const paymentClient = new MPPayment(this.defaultMpConfig);
      const response = await paymentClient.get({ id: paymentId });

      if (!response) {
        return null;
      }

      return response as unknown as MercadoPagoPaymentDto;
    } catch (error) {
      this.logger.error(`Failed to fetch MP payment ${paymentId}: ${error}`);
      return null;
    }
  }

  /**
   * Handle payment completion - update booking status
   */
  private async handlePaymentCompleted(payment: Payment): Promise<void> {
    if (!payment.bookingId) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: payment.bookingId },
    });

    if (!booking) return;

    // Update booking based on payment type
    const updateData: Prisma.BookingUpdateInput = {};

    if (payment.type === PaymentType.BOOKING_DEPOSIT) {
      updateData.depositPaid = true;
      updateData.depositPaidAt = new Date();
      updateData.paymentId = payment.id;

      // Change status from RESERVED to PAID
      if (booking.status === BookingStatus.RESERVED) {
        updateData.status = BookingStatus.PAID;
      }
    } else if (payment.type === PaymentType.BOOKING_BALANCE) {
      updateData.balancePaid = true;
      updateData.balancePaidAt = new Date();
    }

    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: updateData,
    });

    // Emit booking updated event
    this.wsGateway.emitToTenant(booking.tenantId, 'booking:updated', {
      id: booking.id,
      status: updateData.status || booking.status,
      depositPaid: updateData.depositPaid || booking.depositPaid,
      balancePaid: updateData.balancePaid || booking.balancePaid,
    });

    this.logger.log(`Booking ${booking.id} updated after payment ${payment.id}`);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(id: string): Promise<PaymentStatusResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Check tenant access
    const tenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && tenantId !== payment.tenantId) {
      throw new ForbiddenException('Cannot access this payment');
    }

    return {
      id: payment.id,
      status: payment.status,
      externalStatus: payment.externalStatus,
      isCompleted: payment.status === PaymentStatus.COMPLETED,
      isPending: payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PROCESSING,
      isFailed: payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.CANCELLED,
      errorMessage: payment.errorMessage,
      completedAt: payment.processedAt,
    };
  }

  /**
   * Get payment by ID
   */
  async findById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Check tenant access
    const tenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && tenantId !== payment.tenantId) {
      throw new ForbiddenException('Cannot access this payment');
    }

    return this.toResponseDto(payment);
  }

  /**
   * List payments with filtering
   */
  async findAll(query: QueryPaymentDto): Promise<PaymentListResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const {
      bookingId,
      subscriptionId,
      customerId,
      type,
      status,
      statuses,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.PaymentWhereInput = {
      tenantId,
    };

    if (bookingId) where.bookingId = bookingId;
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (customerId) where.customerId = customerId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (statuses && statuses.length > 0) where.status = { in: statuses };

    if (startDate) {
      where.createdAt = { ...((where.createdAt as Prisma.DateTimeFilter) || {}), gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...((where.createdAt as Prisma.DateTimeFilter) || {}), lte: new Date(endDate) };
    }

    if (search) {
      where.OR = [
        { externalPaymentId: { contains: search } },
        { externalPreferenceId: { contains: search } },
        { payerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Build order by
    const orderBy: Prisma.PaymentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute queries
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: payments.map((p) => this.toResponseDto(p)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get payments for a booking
   */
  async getPaymentsForBooking(bookingId: string): Promise<PaymentResponseDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        bookingId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => this.toResponseDto(p));
  }

  /**
   * Refresh payment status from Mercado Pago
   * Useful for reconciliation or manual checks
   */
  async refreshPaymentStatus(id: string): Promise<PaymentStatusResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Check tenant access
    const tenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && tenantId !== payment.tenantId) {
      throw new ForbiddenException('Cannot access this payment');
    }

    // If no external payment ID, we can't refresh
    if (!payment.externalPaymentId) {
      return this.getPaymentStatus(id);
    }

    // Fetch from Mercado Pago
    const mpPayment = await this.fetchMercadoPagoPayment(payment.externalPaymentId);

    if (mpPayment) {
      const newStatus = MP_STATUS_MAP[mpPayment.status] || payment.status;

      if (newStatus !== payment.status) {
        const updatedPayment = await this.prisma.payment.update({
          where: { id },
          data: {
            externalStatus: mpPayment.status,
            status: newStatus,
            processedAt: newStatus === PaymentStatus.COMPLETED ? new Date() : payment.processedAt,
          },
        });

        // Handle completed payment
        if (newStatus === PaymentStatus.COMPLETED && payment.status !== PaymentStatus.COMPLETED) {
          await this.handlePaymentCompleted(updatedPayment);
        }

        this.logger.log(`Payment ${id} status refreshed: ${payment.status} -> ${newStatus}`);
      }
    }

    return this.getPaymentStatus(id);
  }

  /**
   * Convert Payment to response DTO
   */
  private toResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      tenantId: payment.tenantId,
      bookingId: payment.bookingId,
      subscriptionId: payment.subscriptionId,
      customerId: payment.customerId,
      type: payment.type,
      amount: Number(payment.amount),
      currency: payment.currency,
      externalPreferenceId: payment.externalPreferenceId,
      externalPaymentId: payment.externalPaymentId,
      externalStatus: payment.externalStatus,
      status: payment.status,
      payerEmail: payment.payerEmail,
      paymentMethod: payment.paymentMethod,
      webhookReceivedAt: payment.webhookReceivedAt,
      processedAt: payment.processedAt,
      errorMessage: payment.errorMessage,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
