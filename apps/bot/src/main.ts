// Bot Worker Entry Point
// This worker handles WhatsApp message processing with AI

import 'dotenv/config';
import { logger } from './config/logger.config';
import { envConfig } from './config/env.config';
import { createRedisConnection, closeRedisConnection } from './config/redis.config';
import {
  createDatabaseConnection,
  closeDatabaseConnection,
} from './config/database.config';
import { initializeQueues, closeQueues } from './queue/queue.config';
import {
  startIncomingMessageProcessor,
  stopIncomingMessageProcessor,
} from './queue/processors/incoming.processor';
import {
  startOutgoingMessageProcessor,
  stopOutgoingMessageProcessor,
} from './queue/processors/outgoing.processor';

async function bootstrap() {
  logger.info('🤖 Bot Worker Starting...');
  logger.info({ env: envConfig.NODE_ENV }, 'Environment loaded');

  try {
    // Step 1: Connect to Redis
    logger.info('📡 Connecting to Redis...');
    createRedisConnection();

    // Step 2: Connect to Database
    logger.info('🗄️ Connecting to Database...');
    createDatabaseConnection();

    // Step 3: Initialize BullMQ Queues
    logger.info('📬 Initializing message queues...');
    await initializeQueues();

    // Step 4: Start Message Processors
    logger.info('⚙️ Starting message processors...');
    startIncomingMessageProcessor();
    startOutgoingMessageProcessor();

    // TODO Phase 7.2-7.11: Initialize additional services
    // - WhatsAppConnectionService
    // - HumanSimulationService
    // - RiskMitigationService
    // - GeminiService
    // - WhisperService
    // - ConversationContextService
    // - EscalationService

    logger.info('✅ Bot Worker started successfully');
    logger.info('👂 Listening for messages...');
  } catch (error) {
    logger.error({ error }, '❌ Failed to start Bot Worker');
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('🛑 Shutting down Bot Worker...');

  try {
    // Stop processors
    await stopIncomingMessageProcessor();
    await stopOutgoingMessageProcessor();

    // Close queues
    await closeQueues();

    // Close connections
    await closeRedisConnection();
    await closeDatabaseConnection();

    logger.info('✅ Bot Worker shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Error during shutdown');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, '💥 Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, '💥 Unhandled rejection');
  process.exit(1);
});

// Start the bot worker
bootstrap();
