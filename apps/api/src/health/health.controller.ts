// Health Check Controller
// Provides endpoints for monitoring and health checks

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
  uptime: number;
}

@ApiTags('Health')
@Controller('health')
@Public() // Health endpoints are publicly accessible
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
  })
  async check(): Promise<HealthStatus> {
    const services = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };

    // Database is required, Redis is optional (especially in development)
    const isHealthy = services.database === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to receive traffic',
  })
  async ready(): Promise<{ ready: boolean }> {
    const dbOk = (await this.checkDatabase()) === 'up';
    const redisOk = (await this.checkRedis()) === 'up';

    return { ready: dbOk && redisOk };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
  })
  live(): { alive: boolean } {
    return { alive: true };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      if (!this.redis.isRedisConnected()) {
        return 'down';
      }
      const client = this.redis.getClient();
      if (!client) {
        return 'down';
      }
      await client.ping();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
