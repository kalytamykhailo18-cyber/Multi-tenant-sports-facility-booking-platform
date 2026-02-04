// Takeover Service (API wrapper for bot's HumanTakeoverService)
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import {
  ActivateTakeoverDto,
  ExtendTakeoverDto,
  ResumeBotDto,
} from './dto/activate-takeover.dto';

export interface TakeoverState {
  facilityId: string;
  customerPhone: string;
  activatedAt: number;
  expiresAt: number;
  silenceDurationMinutes: number;
  pausedBy: 'auto' | 'manual';
  reason?: string;
}

export interface TakeoverStatus {
  isActive: boolean;
  state?: TakeoverState;
  remainingMinutes?: number;
}

@Injectable()
export class TakeoverService {
  private readonly logger = new Logger(TakeoverService.name);
  private readonly TAKEOVER_PREFIX = 'human_takeover';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Get Redis key for takeover state
   */
  private getTakeoverKey(facilityId: string, customerPhone: string): string {
    return `${this.TAKEOVER_PREFIX}:${facilityId}:${customerPhone}`;
  }

  /**
   * Activate human takeover (manually from dashboard)
   */
  async activate(
    facilityId: string,
    dto: ActivateTakeoverDto
  ): Promise<TakeoverState> {
    const silenceDurationMinutes = dto.silenceDurationMinutes ?? 30;
    const now = Date.now();
    const expiresAt = now + silenceDurationMinutes * 60 * 1000;

    const state: TakeoverState = {
      facilityId,
      customerPhone: dto.customerPhone,
      activatedAt: now,
      expiresAt,
      silenceDurationMinutes,
      pausedBy: 'manual',
      reason: dto.reason,
    };

    const key = this.getTakeoverKey(facilityId, dto.customerPhone);

    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      await client.set(key, JSON.stringify(state), 'PX', expiresAt - now);

      this.logger.log(
        `Takeover activated for facility ${facilityId}, customer ${dto.customerPhone}`
      );

      return state;
    } catch (error) {
      this.logger.error(`Failed to activate takeover: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get takeover status
   */
  async getStatus(
    facilityId: string,
    customerPhone: string
  ): Promise<TakeoverStatus> {
    const key = this.getTakeoverKey(facilityId, customerPhone);

    try {
      const client = this.redisService.getClient();
      if (!client) {
        return { isActive: false };
      }

      const data = await client.get(key);

      if (!data) {
        return { isActive: false };
      }

      const state: TakeoverState = JSON.parse(data);

      const now = Date.now();
      if (now >= state.expiresAt) {
        await client.del(key);
        return { isActive: false };
      }

      const remainingMinutes = Math.ceil((state.expiresAt - now) / (60 * 1000));

      return {
        isActive: true,
        state,
        remainingMinutes,
      };
    } catch (error) {
      this.logger.error(`Failed to get takeover status: ${error.message}`);
      return { isActive: false };
    }
  }

  /**
   * Resume bot (end takeover)
   */
  async resume(facilityId: string, dto: ResumeBotDto): Promise<void> {
    const key = this.getTakeoverKey(facilityId, dto.customerPhone);

    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      const deleted = await client.del(key);

      if (deleted > 0) {
        this.logger.log(
          `Bot resumed for facility ${facilityId}, customer ${dto.customerPhone}`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to resume bot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extend takeover duration
   */
  async extend(
    facilityId: string,
    dto: ExtendTakeoverDto
  ): Promise<TakeoverState | null> {
    const status = await this.getStatus(facilityId, dto.customerPhone);

    if (!status.isActive || !status.state) {
      return null;
    }

    const state = status.state;
    const newExpiresAt = state.expiresAt + dto.additionalMinutes * 60 * 1000;
    const newDuration = state.silenceDurationMinutes + dto.additionalMinutes;

    const updatedState: TakeoverState = {
      ...state,
      expiresAt: newExpiresAt,
      silenceDurationMinutes: newDuration,
    };

    const key = this.getTakeoverKey(facilityId, dto.customerPhone);
    const ttl = newExpiresAt - Date.now();

    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      await client.set(key, JSON.stringify(updatedState), 'PX', ttl);

      this.logger.log(
        `Takeover extended for facility ${facilityId}, customer ${dto.customerPhone}`
      );

      return updatedState;
    } catch (error) {
      this.logger.error(`Failed to extend takeover: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all active takeovers for a facility
   */
  async getActiveTakeovers(facilityId: string): Promise<TakeoverState[]> {
    const pattern = `${this.TAKEOVER_PREFIX}:${facilityId}:*`;

    try {
      const client = this.redisService.getClient();
      if (!client) {
        return [];
      }

      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return [];
      }

      const states: TakeoverState[] = [];

      for (const key of keys) {
        const data = await client.get(key);
        if (data) {
          const state: TakeoverState = JSON.parse(data);

          // Verify not expired
          if (Date.now() < state.expiresAt) {
            states.push(state);
          }
        }
      }

      return states;
    } catch (error) {
      this.logger.error(`Failed to get active takeovers: ${error.message}`);
      return [];
    }
  }
}
