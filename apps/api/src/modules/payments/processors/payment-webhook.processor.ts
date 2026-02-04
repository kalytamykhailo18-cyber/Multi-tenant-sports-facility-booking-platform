// Payment Webhook Processor
// Processes Mercado Pago webhooks asynchronously with retry logic and exponential backoff
// Follows the rule: "Return 200 immediately (< 5 seconds), push payload to queue for async processing"

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { PaymentsService } from '../payments.service';
import { MercadoPagoWebhookDto, WebhookProcessingResultDto } from '../dto/webhook.dto';

/**
 * Job data structure for payment webhook processing
 */
export interface PaymentWebhookJobData {
  payload: MercadoPagoWebhookDto;
  receivedAt: string;
  requestId?: string;
  attempt?: number;
}

/**
 * Job options for webhook processing with exponential backoff
 * Retry strategy:
 * - Attempt 1: Immediate
 * - Attempt 2: After 30 seconds
 * - Attempt 3: After 2 minutes
 * - Attempt 4: After 8 minutes
 * - Attempt 5: After 30 minutes
 */
export const WEBHOOK_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 30000, // 30 seconds base delay
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs
  },
  removeOnFail: {
    count: 500, // Keep last 500 failed jobs for analysis
  },
};

@Processor(QUEUE_NAMES.PAYMENT_WEBHOOK)
export class PaymentWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentWebhookProcessor.name);

  constructor(private readonly paymentsService: PaymentsService) {
    super();
  }

  /**
   * Process a webhook job from the queue
   * This is called automatically by BullMQ when a job is ready
   */
  async process(job: Job<PaymentWebhookJobData>): Promise<WebhookProcessingResultDto> {
    const { payload, receivedAt, requestId } = job.data;
    const attemptNumber = job.attemptsMade + 1;

    this.logger.log(
      `Processing webhook job ${job.id} (attempt ${attemptNumber}/${WEBHOOK_JOB_OPTIONS.attempts}): ` +
      `type=${payload.type}, dataId=${payload.data?.id}, requestId=${requestId}`
    );

    try {
      // Process the webhook using the existing service method
      const result = await this.paymentsService.processWebhook(payload);

      if (result.success) {
        this.logger.log(
          `Webhook job ${job.id} processed successfully: paymentId=${result.paymentId}, ` +
          `bookingId=${result.bookingId}, isDuplicate=${result.isDuplicate}`
        );
      } else {
        this.logger.warn(
          `Webhook job ${job.id} processed with failure: message=${result.message}`
        );

        // If it's a retriable error, throw to trigger retry
        if (this.isRetriableError(result.message)) {
          throw new Error(`Retriable error: ${result.message}`);
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Webhook job ${job.id} failed (attempt ${attemptNumber}): ${errorMessage}`
      );

      // Re-throw to trigger BullMQ retry with exponential backoff
      throw error;
    }
  }

  /**
   * Determine if an error is retriable
   * Network errors, timeouts, and temporary service unavailability should be retried
   */
  private isRetriableError(message?: string): boolean {
    if (!message) return false;

    const retriablePatterns = [
      'network',
      'timeout',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'service unavailable',
      'rate limit',
      '503',
      '502',
      '504',
      'Could not fetch payment',
    ];

    const lowerMessage = message.toLowerCase();
    return retriablePatterns.some(pattern =>
      lowerMessage.includes(pattern.toLowerCase())
    );
  }

  /**
   * Called when a job is completed successfully
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job<PaymentWebhookJobData>) {
    this.logger.log(
      `Webhook job ${job.id} completed successfully after ${job.attemptsMade + 1} attempt(s)`
    );
  }

  /**
   * Called when a job fails after all retries
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job<PaymentWebhookJobData> | undefined, error: Error) {
    if (!job) {
      this.logger.error(`A webhook job failed with error: ${error.message}`);
      return;
    }

    const { payload, requestId } = job.data;

    this.logger.error(
      `Webhook job ${job.id} failed permanently after ${job.attemptsMade} attempts: ` +
      `type=${payload.type}, dataId=${payload.data?.id}, requestId=${requestId}, ` +
      `error=${error.message}`
    );

    // TODO: Send alert to admin about permanently failed webhook
    // This could be implemented with a notification service
  }

  /**
   * Called when a job is being retried
   */
  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker error: ${error.message}`);
  }
}
