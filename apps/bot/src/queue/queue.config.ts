// BullMQ Queue Configuration
import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq';
import { getRedisClient } from '../config/redis.config';
import { logger } from '../config/logger.config';

export enum QueueName {
  INCOMING_MESSAGES = 'incoming-messages',
  OUTGOING_MESSAGES = 'outgoing-messages',
  AI_PROCESSING = 'ai-processing',
  NOTIFICATION_MESSAGES = 'notification-messages',
  CONNECTION_EVENTS = 'connection-events',
}

// Base queue options
const baseQueueOptions: QueueOptions = {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
};

// Base worker options
const baseWorkerOptions: WorkerOptions = {
  connection: getRedisClient(),
  autorun: true,
  concurrency: 10,
  limiter: {
    max: 100,
    duration: 60000, // 100 jobs per minute
  },
};

// Queue instances
export const queues = {
  incomingMessages: new Queue(QueueName.INCOMING_MESSAGES, {
    ...baseQueueOptions,
    defaultJobOptions: {
      ...baseQueueOptions.defaultJobOptions,
      priority: 1, // High priority for incoming messages
    },
  }),

  outgoingMessages: new Queue(QueueName.OUTGOING_MESSAGES, {
    ...baseQueueOptions,
    defaultJobOptions: {
      ...baseQueueOptions.defaultJobOptions,
      priority: 2, // Medium-high priority
    },
  }),

  aiProcessing: new Queue(QueueName.AI_PROCESSING, {
    ...baseQueueOptions,
    defaultJobOptions: {
      ...baseQueueOptions.defaultJobOptions,
      priority: 3, // Medium priority
      attempts: 2, // Fewer retries for AI calls
    },
  }),

  notificationMessages: new Queue(QueueName.NOTIFICATION_MESSAGES, {
    ...baseQueueOptions,
    defaultJobOptions: {
      ...baseQueueOptions.defaultJobOptions,
      priority: 4, // Lower priority for notifications
    },
  }),

  connectionEvents: new Queue(QueueName.CONNECTION_EVENTS, {
    ...baseQueueOptions,
    defaultJobOptions: {
      ...baseQueueOptions.defaultJobOptions,
      priority: 1, // High priority for connection events
      attempts: 5, // More retries for connection events
    },
  }),
};

// Helper to add job to queue with facility-based rate limiting
export async function addJobWithRateLimit(
  queue: Queue,
  jobName: string,
  data: any,
  facilityId: string,
  options?: any
) {
  return queue.add(jobName, data, {
    ...options,
    jobId: `${facilityId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  });
}

// Initialize all queues
export async function initializeQueues() {
  logger.info('Initializing BullMQ queues...');

  // Wait for all queues to be ready
  await Promise.all([
    queues.incomingMessages.waitUntilReady(),
    queues.outgoingMessages.waitUntilReady(),
    queues.aiProcessing.waitUntilReady(),
    queues.notificationMessages.waitUntilReady(),
    queues.connectionEvents.waitUntilReady(),
  ]);

  logger.info('✅ All BullMQ queues initialized');
}

// Close all queues
export async function closeQueues() {
  logger.info('Closing BullMQ queues...');

  await Promise.all([
    queues.incomingMessages.close(),
    queues.outgoingMessages.close(),
    queues.aiProcessing.close(),
    queues.notificationMessages.close(),
    queues.connectionEvents.close(),
  ]);

  logger.info('All BullMQ queues closed');
}

// Export worker options for processors
export { baseWorkerOptions };
