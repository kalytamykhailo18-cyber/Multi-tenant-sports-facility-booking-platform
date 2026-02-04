// Incoming Message Processor
import { Worker, Job } from 'bullmq';
import { QueueName, baseWorkerOptions } from '../queue.config';
import type { IncomingMessageJob } from '../queue.service';
import { logger } from '../../config/logger.config';
import { ConversationService } from '../../conversation/conversation.service';
import { QueueService } from '../queue.service';

let worker: Worker | null = null;
const conversationService = new ConversationService();
const queueService = new QueueService();

export function startIncomingMessageProcessor() {
  if (worker) {
    logger.warn('Incoming message processor already running');
    return worker;
  }

  worker = new Worker<IncomingMessageJob>(
    QueueName.INCOMING_MESSAGES,
    async (job: Job<IncomingMessageJob>) => {
      const { facilityId, from, message, messageType, timestamp } = job.data;

      logger.info(
        {
          facilityId,
          from,
          messageType,
          messageLength: message.length,
          timestamp,
        },
        '📥 Processing incoming message'
      );

      try {
        // Phase 7.2-7.6: Process message with conversation service
        // This handles: takeover check, AI processing, context management
        const result = await conversationService.processMessage({
          facilityId,
          customerPhone: from,
          message,
          messageType,
          audioBuffer: job.data.mediaUrl ? undefined : undefined, // TODO: Download audio from mediaUrl
        });

        // If bot should not respond (e.g., takeover active), skip
        if (!result.shouldRespond) {
          logger.info({ facilityId, from }, 'Bot not responding (takeover or other reason)');
          return;
        }

        // If should escalate to human
        if (result.shouldEscalate) {
          logger.warn(
            {
              facilityId,
              from,
              reason: result.escalationReason,
            },
            '⚠️ Escalating to human'
          );

          // TODO Phase 7.10: Trigger escalation (send alert to owner)
          // For now, just activate takeover
          // await escalationService.escalate(facilityId, from, result.escalationReason);
        }

        // Queue outgoing message (with human simulation)
        if (result.response) {
          await queueService.addOutgoingMessage({
            facilityId,
            to: from,
            message: result.response,
            messageType: 'text',
            applyHumanSimulation: true,
          });

          logger.info(
            {
              facilityId,
              from,
              intent: result.intent,
              responseLength: result.response.length,
            },
            '✅ Incoming message processed, response queued'
          );
        }

        // TODO Phase 7.7-7.9: Route to appropriate intent handler for actions
        // - BOOKING: Check availability, create reservation
        // - CANCELLATION: Cancel booking, apply policy
        // - FIND_OPPONENT: Search and match players
      } catch (error) {
        logger.error(
          { error, facilityId, from },
          '❌ Failed to process incoming message'
        );
        throw error; // Trigger retry
      }
    },
    {
      ...baseWorkerOptions,
      concurrency: 5, // Process 5 messages concurrently
    }
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Incoming message job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, error: err },
      'Incoming message job failed'
    );
  });

  logger.info('✅ Incoming message processor started');
  return worker;
}

export async function stopIncomingMessageProcessor() {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Incoming message processor stopped');
  }
}
