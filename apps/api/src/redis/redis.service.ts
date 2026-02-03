// Redis Service
// Provides Redis connection for caching and queues

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    this.client = new Redis(redisUrl!, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis error:', error.message);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connection established');
      this.isConnected = true;
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    try {
      await this.client!.connect();
      this.isConnected = true;
    } catch (error) {
      this.logger.error('Failed to connect to Redis');
      this.isConnected = false;
      // In development, allow app to start without Redis
      if (nodeEnv === 'production') {
        throw error;
      }
      this.logger.warn('Redis unavailable - caching disabled. App will run without Redis in development mode.');
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('Redis connection closed gracefully');
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the Redis client instance
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis del error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Redis delByPattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL on a key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      this.logger.error(`Redis expire error for key ${key}:`, error);
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }
    try {
      return this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set a value only if the key does not exist (atomic operation)
   * Returns true if key was set, false if key already exists
   */
  async setNx(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        // Use SET with NX and EX for atomic set-if-not-exists with TTL
        const result = await this.client.set(key, stringValue, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } else {
        const result = await this.client.setnx(key, stringValue);
        return result === 1;
      }
    } catch (error) {
      this.logger.error(`Redis setNx error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   * Note: Use sparingly in production as KEYS can be slow on large datasets
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      return [];
    }
    try {
      return this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Get Redis connection options for BullMQ
   */
  getConnectionOptions() {
    return {
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db'),
    };
  }
}
