// Outgoing Message Processor
import { Worker, Job } from 'bullmq';
import { QueueName, baseWorkerOptions } from '../queue.config';
import type { OutgoingMessageJob } from '../queue.service';
import { logger } from '../../config/logger.config';
import { WhatsAppConnectionService } from '../../whatsapp/connection.service';
import { WhatsAppService } from '../../whatsapp/whatsapp.service';
import { HumanSimulationService } from '../../whatsapp/human-simulation.service';
import { RiskMitigationService } from '../../whatsapp/risk-mitigation.service';
import { QueueService } from '../queue.service';

let worker: Worker | null = null;
const connectionService = new WhatsAppConnectionService();
const whatsappService = new WhatsAppService(connectionService, new QueueService());
const humanSimulationService = new HumanSimulationService();
const riskMitigationService = new RiskMitigationService();

export function startOutgoingMessageProcessor() {
  if (worker) {
    logger.warn('Outgoing message processor already running');
    return worker;
  }

  worker = new Worker<OutgoingMessageJob>(
    QueueName.OUTGOING_MESSAGES,
    async (job: Job<OutgoingMessageJob>) => {
      const { facilityId, to, message, messageType, applyHumanSimulation } = job.data;

      logger.info(
        {
          facilityId,
          to,
          messageType,
          messageLength: message.length,
          humanSimulation: applyHumanSimulation,
        },
        '📤 Processing outgoing message'
      );

      try {
        // Phase 7.4: Check daily message limit (warm-up protection)
        const canSend = await riskMitigationService.canSendMessage(facilityId);

        if (!canSend) {
          const status = await riskMitigationService.getMaxMessagesForToday(facilityId);
          logger.warn(
            {
              facilityId,
              messagesSentToday: status.messagesSentToday,
              maxAllowed: status.maxMessagesAllowed,
            },
            '⚠️ Daily message limit reached - skipping send'
          );
          return;
        }

        // Phase 7.4: Check conversational rate limit (max 5/min per chat)
        const rateLimitStatus = await riskMitigationService.checkConversationalRateLimit(
          facilityId,
          to
        );

        if (!rateLimitStatus.allowed) {
          logger.warn(
            {
              facilityId,
              to,
              messagesInWindow: rateLimitStatus.messagesInWindow,
            },
            '⚠️ Conversational rate limit exceeded - adding delay'
          );

          // Add extra delay (30 seconds)
          await new Promise((resolve) => setTimeout(resolve, 30000));
        }

        // Get WhatsApp socket
        const socket = connectionService.getSocket(facilityId);

        if (!socket) {
          throw new Error(`Facility ${facilityId} not connected to WhatsApp`);
        }

        // Format phone number to JID
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

        // Phase 7.2: Apply human simulation (if enabled)
        if (applyHumanSimulation) {
          const config = await humanSimulationService.getFacilityConfig(facilityId);

          // Apply reading delay first
          await humanSimulationService.applyReadingDelay();

          // Apply full simulation (typing status + delay)
          await humanSimulationService.applySimulation(socket, jid, message.length, config);
        }

        // Phase 7.1.3: Send message via WhatsApp
        await whatsappService.sendTextMessage(facilityId, to, message);

        // Increment message counter for warm-up tracking
        await riskMitigationService.incrementMessageCount(facilityId);

        logger.info(
          {
            facilityId,
            to,
            messageLength: message.length,
            humanSimulation: applyHumanSimulation,
          },
          '✅ Outgoing message sent'
        );
      } catch (error) {
        logger.error(
          { error, facilityId, to },
          '❌ Failed to send outgoing message'
        );
        throw error; // Trigger retry
      }
    },
    {
      ...baseWorkerOptions,
      concurrency: 3, // Limit concurrency to prevent spam
      limiter: {
        max: 30, // Max 30 messages per minute (conservative)
        duration: 60000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Outgoing message job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, error: err },
      'Outgoing message job failed'
    );
  });

  logger.info('✅ Outgoing message processor started');
  return worker;
}

export async function stopOutgoingMessageProcessor() {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Outgoing message processor stopped');
  }
}
