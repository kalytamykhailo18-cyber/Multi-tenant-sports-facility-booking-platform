// Redis Configuration for Bot Worker
import Redis from 'ioredis';
import { envConfig } from './env.config';
import { logger } from './logger.config';

let redisClient: Redis | null = null;

export function createRedisConnection(): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(envConfig.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      return false;
    },
  });

  redisClient.on('connect', () => {
    logger.info('✅ Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error({ err }, '❌ Redis connection error');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('🔄 Redis reconnecting...');
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisConnection() first.');
  }
  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}
