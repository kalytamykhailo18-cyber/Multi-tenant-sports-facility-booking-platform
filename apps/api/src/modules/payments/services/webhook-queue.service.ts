// Webhook Queue Service
// Handles queueing webhooks for async processing
// This ensures webhooks are processed reliably with retries and doesn't block the HTTP response

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { MercadoPagoWebhookDto } from '../dto/webhook.dto';
import {
  PaymentWebhookJobData,
  WEBHOOK_JOB_OPTIONS,
} from '../processors/payment-webhook.processor';

/**
 * Result of queueing a webhook
 */
export interface QueueWebhookResult {
  success: boolean;
  jobId?: string;
  message: string;
}

@Injectable()
export class WebhookQueueService {
  private readonly logger = new Logger(WebhookQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.PAYMENT_WEBHOOK)
    private readonly webhookQueue: Queue<PaymentWebhookJobData>,
  ) {}

  /**
   * Queue a webhook for async processing
   * Returns immediately so the HTTP endpoint can return 200 quickly
   */
  async queueWebhook(
    payload: MercadoPagoWebhookDto,
    requestId?: string,
  ): Promise<QueueWebhookResult> {
    try {
      const jobData: PaymentWebhookJobData = {
        payload,
        receivedAt: new Date().toISOString(),
        requestId,
      };

      // Generate a unique job ID based on notification ID
      // This helps with deduplication at the queue level
      const jobId = payload.id
        ? `webhook-${payload.id}`
        : `webhook-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const job = await this.webhookQueue.add(
        'process-webhook',
        jobData,
        {
          ...WEBHOOK_JOB_OPTIONS,
          jobId,
          // Prevent duplicate jobs with same ID
          // If a job with this ID exists and isn't completed, skip adding
        },
      );

      this.logger.log(
        `Webhook queued for processing: jobId=${job.id}, ` +
        `type=${payload.type}, dataId=${payload.data?.id}, requestId=${requestId}`
      );

      return {
        success: true,
        jobId: job.id || jobId,
        message: 'Webhook queued for processing',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to queue webhook: ${errorMessage}, ` +
        `type=${payload.type}, dataId=${payload.data?.id}`
      );

      return {
        success: false,
        message: `Failed to queue webhook: ${errorMessage}`,
      };
    }
  }

  /**
   * Get queue health/stats for monitoring
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.webhookQueue.getWaitingCount(),
      this.webhookQueue.getActiveCount(),
      this.webhookQueue.getCompletedCount(),
      this.webhookQueue.getFailedCount(),
      this.webhookQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Check if a webhook with the given ID is already being processed
   */
  async isWebhookInProgress(notificationId: string): Promise<boolean> {
    const jobId = `webhook-${notificationId}`;
    const job = await this.webhookQueue.getJob(jobId);

    if (!job) return false;

    const state = await job.getState();
    return state === 'waiting' || state === 'active' || state === 'delayed';
  }

  /**
   * Retry a failed webhook job
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    const job = await this.webhookQueue.getJob(jobId);

    if (!job) {
      this.logger.warn(`Job ${jobId} not found for retry`);
      return false;
    }

    const state = await job.getState();
    if (state !== 'failed') {
      this.logger.warn(`Job ${jobId} is not in failed state (current: ${state})`);
      return false;
    }

    await job.retry();
    this.logger.log(`Job ${jobId} queued for retry`);
    return true;
  }
}
