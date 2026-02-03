// Redis Configuration
// Redis connection settings for caching and BullMQ queues

import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Parse Redis URL
  const url = new URL(redisUrl);

  return {
    url: redisUrl,
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    db: parseInt(url.pathname?.slice(1) || '0', 10),
  };
});

export type RedisConfig = ReturnType<typeof redisConfig>;
