// Queue Module
// Configures BullMQ with Redis for async job processing
// Used for webhook processing, reconciliation, and other background jobs

import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

@Global()
@Module({
  imports: [
    // Configure BullMQ with Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host', 'localhost');
        const redisPort = configService.get<number>('redis.port', 6379);
        const redisPassword = configService.get<string>('redis.password');
        const redisDb = configService.get<number>('redis.db', 0);

        return {
          connection: {
            host: redisHost,
            port: redisPort,
            password: redisPassword || undefined,
            db: redisDb,
          },
          defaultJobOptions: {
            removeOnComplete: {
              // Keep last 100 completed jobs for debugging
              count: 100,
            },
            removeOnFail: {
              // Keep last 500 failed jobs for analysis
              count: 500,
            },
          },
        };
      },
    }),

    // Register payment webhook queue
    BullModule.registerQueue({
      name: QUEUE_NAMES.PAYMENT_WEBHOOK,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
