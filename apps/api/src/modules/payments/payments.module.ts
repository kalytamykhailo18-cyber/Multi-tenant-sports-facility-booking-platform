// Payments Module
// Payment processing with Mercado Pago integration
// Includes async webhook processing, reconciliation jobs, and queue management

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';

// Services
import { PaymentsService } from './payments.service';
import { WebhookQueueService } from './services/webhook-queue.service';
import { MercadoPagoOAuthService } from './oauth/oauth.service';

// Controllers
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { MercadoPagoOAuthController } from './oauth/oauth.controller';

// Processors
import { PaymentWebhookProcessor } from './processors/payment-webhook.processor';

// Jobs
import { PaymentReconciliationJob } from './jobs/payment-reconciliation.job';

@Module({
  imports: [
    ConfigModule,
    // Register the payment webhook queue for this module
    BullModule.registerQueue({
      name: QUEUE_NAMES.PAYMENT_WEBHOOK,
    }),
  ],
  controllers: [
    PaymentsController,
    WebhooksController,
    MercadoPagoOAuthController,
  ],
  providers: [
    // Core payment service
    PaymentsService,

    // OAuth service for Mercado Pago integration
    MercadoPagoOAuthService,

    // Webhook queue service for async processing
    WebhookQueueService,

    // Queue processor for webhook jobs
    PaymentWebhookProcessor,

    // Scheduled job for payment reconciliation
    PaymentReconciliationJob,
  ],
  exports: [
    PaymentsService,
    MercadoPagoOAuthService,
    WebhookQueueService,
    PaymentReconciliationJob,
  ],
})
export class PaymentsModule {}
