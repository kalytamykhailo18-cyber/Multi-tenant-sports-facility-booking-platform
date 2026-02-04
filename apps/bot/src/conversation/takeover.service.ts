// Human Takeover Service - Bot Silence Logic
// Manages when staff takes over a conversation and bot should remain silent

import { getRedisClient } from '../config/redis.config';
import { logger } from '../config/logger.config';

export interface TakeoverState {
  facilityId: string;
  customerPhone: string;
  activatedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  silenceDurationMinutes: number;
  pausedBy: 'auto' | 'manual'; // Auto-detected or manual button
  reason?: string;
}

export interface TakeoverStatus {
  isActive: boolean;
  state?: TakeoverState;
  remainingMinutes?: number;
}

export class HumanTakeoverService {
  private redis = getRedisClient();
  private readonly TAKEOVER_PREFIX = 'human_takeover';

  /**
   * Get Redis key for takeover state
   */
  private getTakeoverKey(facilityId: string, customerPhone: string): string {
    return `${this.TAKEOVER_PREFIX}:${facilityId}:${customerPhone}`;
  }

  /**
   * Activate human takeover for a conversation
   * Bot will remain silent for specified duration
   */
  async activateTakeover(
    facilityId: string,
    customerPhone: string,
    silenceDurationMinutes: number = 30,
    pausedBy: 'auto' | 'manual' = 'auto',
    reason?: string
  ): Promise<TakeoverState> {
    const now = Date.now();
    const expiresAt = now + silenceDurationMinutes * 60 * 1000;

    const state: TakeoverState = {
      facilityId,
      customerPhone,
      activatedAt: now,
      expiresAt,
      silenceDurationMinutes,
      pausedBy,
      reason,
    };

    const key = this.getTakeoverKey(facilityId, customerPhone);

    try {
      // Store state in Redis with TTL
      await this.redis.set(key, JSON.stringify(state), 'PX', expiresAt - now);

      logger.info(
        {
          facilityId,
          customerPhone,
          silenceDurationMinutes,
          pausedBy,
          reason,
        },
        '🔇 Human takeover activated - bot silenced'
      );

      return state;
    } catch (error) {
      logger.error(
        { error, facilityId, customerPhone },
        'Failed to activate takeover'
      );
      throw error;
    }
  }

  /**
   * Check if takeover is active for a conversation
   */
  async isTakeoverActive(
    facilityId: string,
    customerPhone: string
  ): Promise<TakeoverStatus> {
    const key = this.getTakeoverKey(facilityId, customerPhone);

    try {
      const data = await this.redis.get(key);

      if (!data) {
        return { isActive: false };
      }

      const state: TakeoverState = JSON.parse(data);

      // Check if expired (shouldn't happen due to Redis TTL, but double-check)
      const now = Date.now();
      if (now >= state.expiresAt) {
        await this.redis.del(key);
        return { isActive: false };
      }

      const remainingMinutes = Math.ceil((state.expiresAt - now) / (60 * 1000));

      return {
        isActive: true,
        state,
        remainingMinutes,
      };
    } catch (error) {
      logger.error(
        { error, facilityId, customerPhone },
        'Failed to check takeover status'
      );
      // Default to not active on error (fail open)
      return { isActive: false };
    }
  }

  /**
   * Resume bot (end takeover manually)
   */
  async resumeBot(facilityId: string, customerPhone: string): Promise<void> {
    const key = this.getTakeoverKey(facilityId, customerPhone);

    try {
      const deleted = await this.redis.del(key);

      if (deleted > 0) {
        logger.info(
          { facilityId, customerPhone },
          '🔊 Bot resumed - takeover ended'
        );
      } else {
        logger.warn(
          { facilityId, customerPhone },
          'No active takeover to resume'
        );
      }
    } catch (error) {
      logger.error(
        { error, facilityId, customerPhone },
        'Failed to resume bot'
      );
      throw error;
    }
  }

  /**
   * Extend takeover duration
   */
  async extendTakeover(
    facilityId: string,
    customerPhone: string,
    additionalMinutes: number
  ): Promise<TakeoverState | null> {
    const status = await this.isTakeoverActive(facilityId, customerPhone);

    if (!status.isActive || !status.state) {
      logger.warn(
        { facilityId, customerPhone },
        'Cannot extend - no active takeover'
      );
      return null;
    }

    const state = status.state;
    const newExpiresAt = state.expiresAt + additionalMinutes * 60 * 1000;
    const newDuration = state.silenceDurationMinutes + additionalMinutes;

    const updatedState: TakeoverState = {
      ...state,
      expiresAt: newExpiresAt,
      silenceDurationMinutes: newDuration,
    };

    const key = this.getTakeoverKey(facilityId, customerPhone);
    const ttl = newExpiresAt - Date.now();

    try {
      await this.redis.set(key, JSON.stringify(updatedState), 'PX', ttl);

      logger.info(
        {
          facilityId,
          customerPhone,
          additionalMinutes,
          newDuration,
        },
        '⏰ Takeover extended'
      );

      return updatedState;
    } catch (error) {
      logger.error(
        { error, facilityId, customerPhone },
        'Failed to extend takeover'
      );
      throw error;
    }
  }

  /**
   * Get all active takeovers for a facility
   */
  async getActiveTakeovers(facilityId: string): Promise<TakeoverState[]> {
    const pattern = `${this.TAKEOVER_PREFIX}:${facilityId}:*`;

    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return [];
      }

      const states: TakeoverState[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
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
      logger.error({ error, facilityId }, 'Failed to get active takeovers');
      return [];
    }
  }

  /**
   * Detect if message is from staff (manual response from phone)
   * Returns true if message should trigger auto-takeover
   */
  isMessageFromStaff(message: any): boolean {
    // In Baileys, messages sent from the connected phone have fromMe = true
    // Messages sent via the bot API also have fromMe = true
    // We need to distinguish between them

    // For now, we'll rely on manual dashboard activation
    // Advanced detection can be added later by tracking bot-sent message IDs
    // and comparing against received messages

    return false; // Placeholder - will implement advanced detection later
  }

  /**
   * Auto-detect staff intervention and activate takeover
   */
  async detectAndActivateTakeover(
    facilityId: string,
    customerPhone: string,
    message: any,
    defaultSilenceMinutes: number = 30
  ): Promise<boolean> {
    // Check if message is from staff
    const isFromStaff = this.isMessageFromStaff(message);

    if (!isFromStaff) {
      return false;
    }

    // Activate takeover
    await this.activateTakeover(
      facilityId,
      customerPhone,
      defaultSilenceMinutes,
      'auto',
      'Staff intervention detected'
    );

    return true;
  }

  /**
   * Get facility-specific silence duration configuration
   * TODO: Load from database (Facility settings)
   */
  async getFacilitySilenceDuration(facilityId: string): Promise<number> {
    // TODO: Load from database
    // For now, return default
    return 30; // 30 minutes default
  }
}
