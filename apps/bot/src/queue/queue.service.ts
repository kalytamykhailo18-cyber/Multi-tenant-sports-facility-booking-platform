// Queue Service - BullMQ queue management
import { queues, addJobWithRateLimit } from './queue.config';
import { logger } from '../config/logger.config';

export interface IncomingMessageJob {
  facilityId: string;
  from: string; // Customer phone number
  message: string;
  messageType: 'text' | 'audio' | 'image';
  mediaUrl?: string;
  timestamp: number;
}

export interface OutgoingMessageJob {
  facilityId: string;
  to: string; // Customer phone number
  message: string;
  messageType?: 'text' | 'image' | 'payment_link';
  mediaUrl?: string;
  caption?: string;
  applyHumanSimulation: boolean;
}

export interface AIProcessingJob {
  facilityId: string;
  customerId: string;
  conversationId: string;
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface NotificationMessageJob {
  facilityId: string;
  to: string;
  message: string;
  type: 'morning_confirmation' | 'follow_up' | 'waiting_list' | 'escalation';
  bookingId?: string;
}

export interface ConnectionEventJob {
  facilityId: string;
  event: 'connected' | 'disconnected' | 'logged_out' | 'qr_generated';
  data?: any;
}

export class QueueService {
  /**
   * Add incoming WhatsApp message to processing queue
   */
  async addIncomingMessage(data: IncomingMessageJob): Promise<void> {
    try {
      await addJobWithRateLimit(
        queues.incomingMessages,
        'process-incoming',
        data,
        data.facilityId
      );

      logger.debug(
        { facilityId: data.facilityId, from: data.from },
        'Added incoming message to queue'
      );
    } catch (error) {
      logger.error({ error, data }, 'Failed to add incoming message to queue');
      throw error;
    }
  }

  /**
   * Add outgoing WhatsApp message to send queue
   */
  async addOutgoingMessage(data: OutgoingMessageJob): Promise<void> {
    try {
      await addJobWithRateLimit(
        queues.outgoingMessages,
        'send-outgoing',
        data,
        data.facilityId
      );

      logger.debug(
        { facilityId: data.facilityId, to: data.to },
        'Added outgoing message to queue'
      );
    } catch (error) {
      logger.error({ error, data }, 'Failed to add outgoing message to queue');
      throw error;
    }
  }

  /**
   * Add AI processing job
   */
  async addAIProcessing(data: AIProcessingJob): Promise<void> {
    try {
      await addJobWithRateLimit(queues.aiProcessing, 'process-ai', data, data.facilityId);

      logger.debug({ facilityId: data.facilityId }, 'Added AI processing job to queue');
    } catch (error) {
      logger.error({ error, data }, 'Failed to add AI processing job to queue');
      throw error;
    }
  }

  /**
   * Add notification message (proactive messages)
   */
  async addNotificationMessage(data: NotificationMessageJob): Promise<void> {
    try {
      await addJobWithRateLimit(
        queues.notificationMessages,
        'send-notification',
        data,
        data.facilityId
      );

      logger.debug(
        { facilityId: data.facilityId, type: data.type },
        'Added notification message to queue'
      );
    } catch (error) {
      logger.error({ error, data }, 'Failed to add notification message to queue');
      throw error;
    }
  }

  /**
   * Add connection event
   */
  async addConnectionEvent(data: ConnectionEventJob): Promise<void> {
    try {
      await addJobWithRateLimit(
        queues.connectionEvents,
        'handle-connection',
        data,
        data.facilityId
      );

      logger.debug({ facilityId: data.facilityId, event: data.event }, 'Added connection event');
    } catch (error) {
      logger.error({ error, data }, 'Failed to add connection event to queue');
      throw error;
    }
  }
}
