// Webhooks Controller
// Handles external payment provider notifications (Mercado Pago IPN)
// CRITICAL: Returns 200 immediately, processes asynchronously via queue

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { WebhookQueueService } from './services/webhook-queue.service';
import { MercadoPagoWebhookDto, WebhookQueuedResponseDto } from './dto/webhook.dto';
import * as crypto from 'crypto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookQueueService: WebhookQueueService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Mercado Pago IPN (Instant Payment Notification) webhook handler
   * This endpoint receives payment status updates from Mercado Pago
   *
   * CRITICAL REQUIREMENTS:
   * - Must be public (no auth required)
   * - Must return 200 within 5 seconds (Mercado Pago retries otherwise)
   * - Must validate signature before processing
   * - Must process asynchronously via queue (never block the response)
   */
  @Post('mercadopago')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mercado Pago webhook',
    description:
      'Receives IPN (Instant Payment Notification) from Mercado Pago when payment status changes. ' +
      'This endpoint is public, validates the webhook signature, and queues the notification for async processing. ' +
      'Returns 200 immediately to satisfy Mercado Pago requirements.',
  })
  @ApiHeader({
    name: 'x-signature',
    description: 'Mercado Pago webhook signature for validation',
    required: false,
  })
  @ApiHeader({
    name: 'x-request-id',
    description: 'Mercado Pago request ID for tracking',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook received and queued for processing',
    type: WebhookQueuedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook payload or signature',
  })
  async handleMercadoPagoWebhook(
    @Body() payload: MercadoPagoWebhookDto,
    @Headers('x-signature') signature?: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<WebhookQueuedResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `Webhook received: type=${payload.type}, id=${payload.data?.id}, requestId=${requestId}`
    );

    // Step 1: Validate webhook payload (fast check)
    if (!payload || !payload.type) {
      this.logger.warn('Invalid webhook payload: missing type');
      throw new BadRequestException('Invalid webhook payload');
    }

    // Step 2: Validate signature if webhook secret is configured
    const webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const isValid = this.validateSignature(payload, signature, webhookSecret, requestId);
      if (!isValid) {
        this.logger.warn(`Invalid webhook signature for request ${requestId}`);
        throw new BadRequestException('Invalid webhook signature');
      }
      this.logger.debug(`Webhook signature validated for request ${requestId}`);
    }

    // Step 3: Queue for async processing (non-blocking)
    // This returns immediately, actual processing happens in PaymentWebhookProcessor
    const queueResult = await this.webhookQueueService.queueWebhook(payload, requestId);

    const elapsed = Date.now() - startTime;
    this.logger.log(
      `Webhook queued in ${elapsed}ms: jobId=${queueResult.jobId}, success=${queueResult.success}`
    );

    // Return 200 immediately - actual processing is async
    return {
      status: 'received',
      jobId: queueResult.jobId,
      message: queueResult.success
        ? 'Webhook queued for processing'
        : 'Webhook received but queueing failed - will retry',
    };
  }

  /**
   * Validate Mercado Pago webhook signature
   * Reference: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
   *
   * Signature format: ts=timestamp,v1=hash
   * Hash is HMAC-SHA256 of: id:dataId;request-id:requestId;ts:timestamp;
   */
  private validateSignature(
    payload: MercadoPagoWebhookDto,
    signature: string,
    secret: string,
    requestId?: string,
  ): boolean {
    try {
      // Parse signature parts: ts=xxx,v1=xxx
      const parts: Record<string, string> = {};
      signature.split(',').forEach((part) => {
        const [key, value] = part.split('=');
        if (key && value) {
          parts[key] = value;
        }
      });

      const timestamp = parts['ts'];
      const hash = parts['v1'];

      if (!timestamp || !hash) {
        this.logger.debug('Signature missing timestamp or hash');
        return false;
      }

      // Optional: Check timestamp is not too old (prevent replay attacks)
      const signatureAge = Date.now() - parseInt(timestamp, 10) * 1000;
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (signatureAge > maxAge) {
        this.logger.debug(`Signature too old: ${signatureAge}ms`);
        return false;
      }

      // Build the manifest string (what Mercado Pago signs)
      // Format: id:dataId;request-id:requestId;ts:timestamp;
      const dataId = payload.data?.id || '';
      const manifest = `id:${dataId};request-id:${requestId || ''};ts:${timestamp};`;

      // Calculate expected hash
      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

      // Compare hashes using constant-time comparison (security best practice)
      try {
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
      } catch {
        // Buffers have different lengths - signatures don't match
        return false;
      }
    } catch (error) {
      this.logger.warn(`Signature validation error: ${error}`);
      return false;
    }
  }

  /**
   * Health check endpoint for webhook configuration testing
   * Mercado Pago may send a test notification when configuring webhooks
   */
  @Post('mercadopago/test')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleTestWebhook(): Promise<{ status: string }> {
    this.logger.log('Test webhook received');
    return { status: 'ok' };
  }

  /**
   * Get webhook queue health/stats for monitoring
   * Protected endpoint - requires authentication
   */
  @Get('mercadopago/stats')
  @ApiOperation({
    summary: 'Get webhook queue statistics',
    description: 'Returns statistics about the webhook processing queue for monitoring purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getWebhookQueueStats(): Promise<{
    queue: string;
    stats: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  }> {
    const stats = await this.webhookQueueService.getQueueStats();

    return {
      queue: 'payment-webhook',
      stats,
    };
  }
}
