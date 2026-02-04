// Block Risk Mitigation Service
// Implements warm-up periods, rate limiting, and block detection

import { getRedisClient } from '../config/redis.config';
import { getDatabaseClient } from '../config/database.config';
import { logger } from '../config/logger.config';

export interface WarmUpStatus {
  daysActive: number;
  maxMessagesAllowed: number;
  messagesSentToday: number;
  isWarning: boolean; // True if approaching limit
}

export interface RateLimitStatus {
  allowed: boolean;
  messagesInWindow: number;
  maxMessages: number;
  windowSeconds: number;
}

export class RiskMitigationService {
  private redis = getRedisClient();
  private db = getDatabaseClient();

  /**
   * Get maximum messages allowed per day based on warm-up period
   * Day 1-3: 10 messages/day
   * Day 4-7: 20 messages/day
   * Day 8-14: 30 messages/day
   * Day 15+: No limit (Infinity)
   */
  async getMaxMessagesForToday(facilityId: string): Promise<WarmUpStatus> {
    try {
      // Get facility to check whatsappConnectedAt
      const facility = await this.db.facility.findUnique({
        where: { id: facilityId },
        select: { whatsappConnectedAt: true },
      });

      if (!facility?.whatsappConnectedAt) {
        // Not yet connected, no limits
        return {
          daysActive: 0,
          maxMessagesAllowed: Infinity,
          messagesSentToday: 0,
          isWarning: false,
        };
      }

      // Calculate days since connection
      const connectedAt = new Date(facility.whatsappConnectedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - connectedAt.getTime());
      const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Determine max messages based on warm-up period
      let maxMessages: number;
      if (daysActive <= 3) {
        maxMessages = 10;
      } else if (daysActive <= 7) {
        maxMessages = 20;
      } else if (daysActive <= 14) {
        maxMessages = 30;
      } else {
        maxMessages = Infinity; // No limit after warm-up
      }

      // Get today's message count
      const messagesSentToday = await this.getMessageCountToday(facilityId);

      // Warning if approaching limit (80% threshold)
      const isWarning = messagesSentToday >= maxMessages * 0.8;

      return {
        daysActive,
        maxMessagesAllowed: maxMessages,
        messagesSentToday,
        isWarning,
      };
    } catch (error) {
      logger.error({ error, facilityId }, 'Failed to get warm-up status');
      // Default to safe limits on error
      return {
        daysActive: 0,
        maxMessagesAllowed: 10,
        messagesSentToday: 0,
        isWarning: false,
      };
    }
  }

  /**
   * Check if facility can send a message (warm-up limit check)
   */
  async canSendMessage(facilityId: string): Promise<boolean> {
    const status = await this.getMaxMessagesForToday(facilityId);

    if (status.messagesSentToday >= status.maxMessagesAllowed) {
      logger.warn(
        {
          facilityId,
          messagesSentToday: status.messagesSentToday,
          maxAllowed: status.maxMessagesAllowed,
        },
        '⚠️ Daily message limit reached'
      );
      return false;
    }

    return true;
  }

  /**
   * Increment daily message counter
   */
  async incrementMessageCount(facilityId: string): Promise<number> {
    const key = `messages:daily:${facilityId}`;
    const count = await this.redis.incr(key);

    // Set expiry to end of day (midnight)
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const secondsUntilMidnight = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
    await this.redis.expire(key, secondsUntilMidnight);

    return count;
  }

  /**
   * Get today's message count
   */
  async getMessageCountToday(facilityId: string): Promise<number> {
    const key = `messages:daily:${facilityId}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Check conversational rate limit (max 5 messages per minute per chat)
   */
  async checkConversationalRateLimit(
    facilityId: string,
    chatId: string
  ): Promise<RateLimitStatus> {
    const key = `rate:${facilityId}:${chatId}`;
    const maxMessages = 5;
    const windowSeconds = 60;

    try {
      const count = await this.redis.incr(key);

      // Set expiry on first message in window
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      }

      const allowed = count <= maxMessages;

      if (!allowed) {
        logger.warn(
          {
            facilityId,
            chatId,
            messagesInWindow: count,
            maxMessages,
          },
          '⚠️ Conversational rate limit exceeded'
        );
      }

      return {
        allowed,
        messagesInWindow: count,
        maxMessages,
        windowSeconds,
      };
    } catch (error) {
      logger.error({ error, facilityId, chatId }, 'Failed to check rate limit');
      // Default to allowing on error (fail open)
      return {
        allowed: true,
        messagesInWindow: 0,
        maxMessages,
        windowSeconds,
      };
    }
  }

  /**
   * Record connection error (for block detection monitoring)
   */
  async recordConnectionError(facilityId: string, errorCode: number): Promise<void> {
    const key = `errors:${facilityId}`;

    try {
      await this.redis.lpush(key, JSON.stringify({ errorCode, timestamp: Date.now() }));
      await this.redis.ltrim(key, 0, 99); // Keep last 100 errors
      await this.redis.expire(key, 86400); // Expire after 24 hours

      // Check if we should alert (401/403 errors are warning signs)
      if (errorCode === 401 || errorCode === 403) {
        const recentErrors = await this.redis.lrange(key, 0, 9); // Last 10 errors
        const recentCount = recentErrors.filter((e) => {
          const parsed = JSON.parse(e);
          return parsed.errorCode === 401 || parsed.errorCode === 403;
        }).length;

        if (recentCount >= 3) {
          logger.error(
            { facilityId, recentCount },
            '🚨 Multiple auth errors detected - possible block warning'
          );
          // TODO: Alert facility owner via dashboard
        }
      }
    } catch (error) {
      logger.error({ error, facilityId }, 'Failed to record connection error');
    }
  }

  /**
   * Get connection error count in last 24 hours
   */
  async getRecentErrorCount(facilityId: string): Promise<number> {
    const key = `errors:${facilityId}`;

    try {
      const errors = await this.redis.lrange(key, 0, -1);
      return errors.length;
    } catch (error) {
      logger.error({ error, facilityId }, 'Failed to get error count');
      return 0;
    }
  }

  /**
   * Check if facility should enter recovery mode (reduce message volume)
   */
  async shouldEnterRecoveryMode(facilityId: string): Promise<boolean> {
    const errorCount = await this.getRecentErrorCount(facilityId);

    // Enter recovery if more than 10 errors in last 24 hours
    if (errorCount > 10) {
      logger.warn(
        { facilityId, errorCount },
        '⚠️ Entering recovery mode due to high error count'
      );
      return true;
    }

    return false;
  }

  /**
   * Clear error history (after successful recovery)
   */
  async clearErrorHistory(facilityId: string): Promise<void> {
    const key = `errors:${facilityId}`;
    await this.redis.del(key);
    logger.info({ facilityId }, 'Error history cleared');
  }
}
