// Payment Reconciliation Job
// Runs hourly to catch missed webhooks and reconcile pending payments
// Ensures customers are never left in limbo due to missed notifications

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../../common/audit/audit.types';
import { WsGateway } from '../../../common/gateway/ws.gateway';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';

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

/**
 * Payment Reconciliation Job
 *
 * This job ensures payment reliability by:
 * 1. Checking pending payments that may have missed webhooks
 * 2. Proactively fetching status from Mercado Pago
 * 3. Updating bookings when payments are confirmed
 * 4. Alerting on stuck or failed payments
 *
 * Runs every hour by default.
 */
@Injectable()
export class PaymentReconciliationJob {
  private readonly logger = new Logger(PaymentReconciliationJob.name);
  private readonly defaultMpConfig: MercadoPagoConfig | null;

  // Configuration thresholds
  private readonly PENDING_THRESHOLD_MINUTES = 15; // Check payments pending longer than this
  private readonly STALE_THRESHOLD_HOURS = 24; // Alert on payments pending longer than this
  private readonly MAX_RECONCILE_BATCH = 50; // Maximum payments to check per run

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {
    // Initialize default Mercado Pago config
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    this.defaultMpConfig = accessToken
      ? new MercadoPagoConfig({ accessToken })
      : null;
  }

  /**
   * Main reconciliation job - runs every hour
   * Checks pending payments and reconciles with Mercado Pago
   */
  @Cron(CronExpression.EVERY_HOUR)
  async reconcilePendingPayments(): Promise<void> {
    if (!this.defaultMpConfig) {
      this.logger.warn('Mercado Pago not configured, skipping reconciliation');
      return;
    }

    this.logger.log('Starting payment reconciliation job');
    const startTime = Date.now();

    try {
      const results = await this.runReconciliation();

      const elapsed = Date.now() - startTime;
      this.logger.log(
        `Payment reconciliation completed in ${elapsed}ms: ` +
        `checked=${results.checked}, updated=${results.updated}, ` +
        `completed=${results.completed}, failed=${results.failed}, errors=${results.errors}`
      );

      // Audit log the reconciliation run
      this.auditService.log({
        category: AuditEventCategory.PAYMENT,
        eventType: AuditEventType.PAYMENT_RECONCILIATION,
        tenantId: null,
        actor: { type: 'SYSTEM', id: null },
        action: 'Payment reconciliation job completed',
        entity: { type: 'SYSTEM', id: 'payment-reconciliation' },
        metadata: {
          ...results,
          elapsedMs: elapsed,
        },
      });
    } catch (error) {
      this.logger.error(`Payment reconciliation failed: ${error}`);
    }
  }

  /**
   * Proactive check - runs every 5 minutes for more time-sensitive payments
   * Only checks very recent pending payments (last 15 minutes)
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async proactiveCheck(): Promise<void> {
    if (!this.defaultMpConfig) return;

    try {
      const recentPending = await this.getRecentPendingPayments();

      if (recentPending.length === 0) return;

      this.logger.debug(`Proactive check: ${recentPending.length} recent pending payments`);

      for (const payment of recentPending) {
        await this.checkAndUpdatePayment(payment);
      }
    } catch (error) {
      this.logger.error(`Proactive check failed: ${error}`);
    }
  }

  /**
   * Run the full reconciliation process
   */
  private async runReconciliation(): Promise<{
    checked: number;
    updated: number;
    completed: number;
    failed: number;
    errors: number;
    stale: number;
  }> {
    const results = {
      checked: 0,
      updated: 0,
      completed: 0,
      failed: 0,
      errors: 0,
      stale: 0,
    };

    // Get pending payments that need reconciliation
    const pendingPayments = await this.getPendingPayments();

    this.logger.log(`Found ${pendingPayments.length} pending payments to reconcile`);

    for (const payment of pendingPayments) {
      results.checked++;

      try {
        const updateResult = await this.checkAndUpdatePayment(payment);

        if (updateResult.updated) {
          results.updated++;

          if (updateResult.newStatus === PaymentStatus.COMPLETED) {
            results.completed++;
          } else if (updateResult.newStatus === PaymentStatus.FAILED) {
            results.failed++;
          }
        }

        if (updateResult.isStale) {
          results.stale++;
        }
      } catch (error) {
        results.errors++;
        this.logger.error(`Error reconciling payment ${payment.id}: ${error}`);
      }
    }

    // Alert on stale payments
    if (results.stale > 0) {
      await this.alertStalePayments(results.stale);
    }

    return results;
  }

  /**
   * Get pending payments that need reconciliation
   */
  private async getPendingPayments(): Promise<Payment[]> {
    const thresholdDate = new Date(
      Date.now() - this.PENDING_THRESHOLD_MINUTES * 60 * 1000
    );

    return this.prisma.payment.findMany({
      where: {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
        externalPreferenceId: { not: null }, // Has been sent to Mercado Pago
        createdAt: { lt: thresholdDate }, // Created more than threshold ago
      },
      orderBy: { createdAt: 'asc' },
      take: this.MAX_RECONCILE_BATCH,
    });
  }

  /**
   * Get very recent pending payments for proactive checking
   */
  private async getRecentPendingPayments(): Promise<Payment[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    return this.prisma.payment.findMany({
      where: {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
        externalPreferenceId: { not: null },
        createdAt: {
          gte: fifteenMinutesAgo,
          lt: fiveMinutesAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit proactive checks
    });
  }

  /**
   * Check and update a single payment from Mercado Pago
   */
  private async checkAndUpdatePayment(
    payment: Payment
  ): Promise<{
    updated: boolean;
    newStatus?: PaymentStatus;
    isStale: boolean;
  }> {
    const isStale = this.isPaymentStale(payment);

    // If we have an external payment ID, fetch that directly
    if (payment.externalPaymentId) {
      return this.fetchAndUpdateByPaymentId(payment, isStale);
    }

    // If only preference ID, we need to search for payments
    if (payment.externalPreferenceId) {
      return this.searchAndUpdateByPreference(payment, isStale);
    }

    return { updated: false, isStale };
  }

  /**
   * Fetch payment by external payment ID and update
   */
  private async fetchAndUpdateByPaymentId(
    payment: Payment,
    isStale: boolean
  ): Promise<{
    updated: boolean;
    newStatus?: PaymentStatus;
    isStale: boolean;
  }> {
    try {
      const paymentClient = new MPPayment(this.defaultMpConfig!);
      const mpPayment = await paymentClient.get({ id: payment.externalPaymentId! });

      if (!mpPayment || !mpPayment.status) {
        return { updated: false, isStale };
      }

      const externalStatus = mpPayment.status as string;
      const newStatus = MP_STATUS_MAP[externalStatus] || payment.status;

      if (newStatus !== payment.status) {
        await this.updatePaymentAndBooking(payment, newStatus, externalStatus);
        return { updated: true, newStatus, isStale };
      }

      return { updated: false, isStale };
    } catch (error) {
      this.logger.warn(`Failed to fetch payment ${payment.externalPaymentId}: ${error}`);
      return { updated: false, isStale };
    }
  }

  /**
   * Search for payments by preference ID and update
   * This is used when we have a preference but haven't received a webhook yet
   */
  private async searchAndUpdateByPreference(
    payment: Payment,
    isStale: boolean
  ): Promise<{
    updated: boolean;
    newStatus?: PaymentStatus;
    isStale: boolean;
  }> {
    try {
      // Mercado Pago doesn't have a direct API to get payments by preference ID
      // The payment ID would be received via webhook
      // This is a limitation - we can only wait for webhook or check if we have external_payment_id

      // For now, just mark as stale if it's been too long
      return { updated: false, isStale };
    } catch (error) {
      this.logger.warn(`Failed to search payments for preference ${payment.externalPreferenceId}: ${error}`);
      return { updated: false, isStale };
    }
  }

  /**
   * Update payment status and related booking
   */
  private async updatePaymentAndBooking(
    payment: Payment,
    newStatus: PaymentStatus,
    externalStatus: string
  ): Promise<void> {
    this.logger.log(
      `Reconciliation: updating payment ${payment.id} from ${payment.status} to ${newStatus}`
    );

    // Update payment
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        externalStatus,
        processedAt: newStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
      },
    });

    // Update booking if payment completed
    if (newStatus === PaymentStatus.COMPLETED && payment.bookingId) {
      await this.updateBookingOnPayment(payment);
    }

    // Emit socket event
    this.wsGateway.emitToTenant(payment.tenantId, 'payment:updated', {
      id: payment.id,
      bookingId: payment.bookingId,
      status: newStatus,
      source: 'reconciliation',
    });

    // Audit log
    this.auditService.log({
      category: AuditEventCategory.PAYMENT,
      eventType: AuditEventType.PAYMENT_RECONCILED,
      tenantId: payment.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Payment reconciled: ${payment.status} -> ${newStatus}`,
      entity: { type: 'PAYMENT', id: payment.id },
      metadata: {
        previousStatus: payment.status,
        newStatus,
        externalStatus,
      },
    });
  }

  /**
   * Update booking when payment is confirmed
   */
  private async updateBookingOnPayment(payment: Payment): Promise<void> {
    if (!payment.bookingId) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: payment.bookingId },
    });

    if (!booking) return;

    const updateData: Prisma.BookingUpdateInput = {};

    if (payment.type === PaymentType.BOOKING_DEPOSIT) {
      updateData.depositPaid = true;
      updateData.depositPaidAt = new Date();
      updateData.paymentId = payment.id;

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
      source: 'reconciliation',
    });
  }

  /**
   * Check if a payment is stale (pending too long)
   */
  private isPaymentStale(payment: Payment): boolean {
    const ageMs = Date.now() - payment.createdAt.getTime();
    const staleThresholdMs = this.STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
    return ageMs > staleThresholdMs;
  }

  /**
   * Alert about stale payments
   */
  private async alertStalePayments(count: number): Promise<void> {
    this.logger.warn(`${count} stale payments found (pending > ${this.STALE_THRESHOLD_HOURS} hours)`);

    // TODO: Implement notification to admin
    // This could be an email, Slack message, or dashboard alert
  }

  /**
   * Manual trigger for reconciliation (can be called via API)
   */
  async triggerManualReconciliation(): Promise<{
    checked: number;
    updated: number;
    completed: number;
    failed: number;
    errors: number;
    stale: number;
  }> {
    if (!this.defaultMpConfig) {
      throw new Error('Mercado Pago not configured');
    }

    this.logger.log('Manual reconciliation triggered');
    return this.runReconciliation();
  }

  /**
   * Reconcile a specific payment by ID
   */
  async reconcilePayment(paymentId: string): Promise<{
    updated: boolean;
    newStatus?: PaymentStatus;
    message: string;
  }> {
    if (!this.defaultMpConfig) {
      throw new Error('Mercado Pago not configured');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return { updated: false, message: 'Payment not found' };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { updated: false, message: 'Payment already completed' };
    }

    const result = await this.checkAndUpdatePayment(payment);

    return {
      updated: result.updated,
      newStatus: result.newStatus,
      message: result.updated
        ? `Payment updated to ${result.newStatus}`
        : 'No status change detected',
    };
  }
}
