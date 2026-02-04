// Context Service - Manages conversation context in Redis
import { getRedisClient } from '../config/redis.config';
import { logger } from '../config/logger.config';
import { Intent } from '../ai/gemini.service';
import type { ConversationMessage } from '../ai/gemini.service';

export interface ConversationContext {
  facilityId: string;
  customerPhone: string;
  conversationId: string;
  currentIntent?: Intent;
  flowState?: string; // Current step in flow (e.g., "awaiting_date", "awaiting_confirmation")
  pendingData?: Record<string, any>; // Collected data for current intent
  messages: ConversationMessage[]; // Conversation history
  failedAttempts: number; // Track failed transcriptions or unclear messages
  lastMessageAt: number; // Unix timestamp
  createdAt: number;
}

export interface CustomerMemory {
  facilityId: string;
  customerPhone: string;
  lastBooking?: {
    courtId: string;
    courtName: string;
    sportType: string;
    duration: number;
    dayOfWeek: number;
    timeSlot: string;
    price: number;
  };
  preferences?: {
    favoriteCourtIds: string[];
    favoriteTimes: string[];
    preferredDuration: number;
  };
  totalBookings: number;
  lastInteractionAt: number;
}

export class ContextService {
  private redis = getRedisClient();
  private readonly CONTEXT_PREFIX = 'conversation';
  private readonly MEMORY_PREFIX = 'customer_memory';
  private readonly CONTEXT_TTL = 24 * 60 * 60; // 24 hours
  private readonly MEMORY_TTL = 30 * 24 * 60 * 60; // 30 days

  /**
   * Get Redis key for conversation context
   */
  private getContextKey(facilityId: string, customerPhone: string): string {
    return `${this.CONTEXT_PREFIX}:${facilityId}:${customerPhone}`;
  }

  /**
   * Get Redis key for customer memory
   */
  private getMemoryKey(facilityId: string, customerPhone: string): string {
    return `${this.MEMORY_PREFIX}:${facilityId}:${customerPhone}`;
  }

  /**
   * Get or create conversation context
   */
  async getContext(facilityId: string, customerPhone: string): Promise<ConversationContext> {
    const key = this.getContextKey(facilityId, customerPhone);

    try {
      const data = await this.redis.get(key);

      if (data) {
        const context: ConversationContext = JSON.parse(data);
        logger.debug(
          {
            facilityId,
            customerPhone,
            messageCount: context.messages.length,
            currentIntent: context.currentIntent,
          },
          'Loaded conversation context'
        );
        return context;
      }

      // Create new context
      const newContext: ConversationContext = {
        facilityId,
        customerPhone,
        conversationId: this.generateConversationId(facilityId, customerPhone),
        messages: [],
        failedAttempts: 0,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
      };

      // Save to Redis
      await this.saveContext(newContext);

      logger.info(
        {
          facilityId,
          customerPhone,
          conversationId: newContext.conversationId,
        },
        'Created new conversation context'
      );

      return newContext;
    } catch (error) {
      logger.error({ error, facilityId, customerPhone }, 'Failed to get context');

      // Return minimal context on error
      return {
        facilityId,
        customerPhone,
        conversationId: this.generateConversationId(facilityId, customerPhone),
        messages: [],
        failedAttempts: 0,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
      };
    }
  }

  /**
   * Save conversation context to Redis
   */
  async saveContext(context: ConversationContext): Promise<void> {
    const key = this.getContextKey(context.facilityId, context.customerPhone);

    try {
      // Update last message timestamp
      context.lastMessageAt = Date.now();

      // Limit message history to last 20 messages (prevent memory bloat)
      if (context.messages.length > 20) {
        context.messages = context.messages.slice(-20);
      }

      await this.redis.set(key, JSON.stringify(context), 'EX', this.CONTEXT_TTL);

      logger.debug(
        {
          facilityId: context.facilityId,
          customerPhone: context.customerPhone,
          messageCount: context.messages.length,
        },
        'Saved conversation context'
      );
    } catch (error) {
      logger.error(
        { error, facilityId: context.facilityId, customerPhone: context.customerPhone },
        'Failed to save context'
      );
    }
  }

  /**
   * Add message to conversation history
   */
  async addMessage(
    facilityId: string,
    customerPhone: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const context = await this.getContext(facilityId, customerPhone);

    context.messages.push({ role, content });

    await this.saveContext(context);
  }

  /**
   * Update current intent and flow state
   */
  async updateIntent(
    facilityId: string,
    customerPhone: string,
    intent: Intent,
    flowState?: string
  ): Promise<void> {
    const context = await this.getContext(facilityId, customerPhone);

    context.currentIntent = intent;
    context.flowState = flowState;

    // Clear pending data if intent changed
    if (context.currentIntent !== intent) {
      context.pendingData = {};
    }

    await this.saveContext(context);
  }

  /**
   * Update pending data for current intent
   */
  async updatePendingData(
    facilityId: string,
    customerPhone: string,
    data: Record<string, any>
  ): Promise<void> {
    const context = await this.getContext(facilityId, customerPhone);

    context.pendingData = {
      ...context.pendingData,
      ...data,
    };

    await this.saveContext(context);
  }

  /**
   * Get conversation history
   */
  async getHistory(
    facilityId: string,
    customerPhone: string
  ): Promise<ConversationMessage[]> {
    const context = await this.getContext(facilityId, customerPhone);
    return context.messages;
  }

  /**
   * Increment failed attempts counter
   */
  async incrementFailedAttempts(
    facilityId: string,
    customerPhone: string
  ): Promise<number> {
    const context = await this.getContext(facilityId, customerPhone);

    context.failedAttempts += 1;

    await this.saveContext(context);

    return context.failedAttempts;
  }

  /**
   * Reset failed attempts counter
   */
  async resetFailedAttempts(facilityId: string, customerPhone: string): Promise<void> {
    const context = await this.getContext(facilityId, customerPhone);

    context.failedAttempts = 0;

    await this.saveContext(context);
  }

  /**
   * Clear conversation context (end conversation)
   */
  async clearContext(facilityId: string, customerPhone: string): Promise<void> {
    const key = this.getContextKey(facilityId, customerPhone);

    try {
      await this.redis.del(key);

      logger.info({ facilityId, customerPhone }, 'Cleared conversation context');
    } catch (error) {
      logger.error({ error, facilityId, customerPhone }, 'Failed to clear context');
    }
  }

  /**
   * Get customer memory (persistent preferences and history)
   */
  async getCustomerMemory(
    facilityId: string,
    customerPhone: string
  ): Promise<CustomerMemory | null> {
    const key = this.getMemoryKey(facilityId, customerPhone);

    try {
      const data = await this.redis.get(key);

      if (data) {
        return JSON.parse(data);
      }

      return null;
    } catch (error) {
      logger.error({ error, facilityId, customerPhone }, 'Failed to get customer memory');
      return null;
    }
  }

  /**
   * Update customer memory
   */
  async updateCustomerMemory(memory: CustomerMemory): Promise<void> {
    const key = this.getMemoryKey(memory.facilityId, memory.customerPhone);

    try {
      memory.lastInteractionAt = Date.now();

      await this.redis.set(key, JSON.stringify(memory), 'EX', this.MEMORY_TTL);

      logger.debug(
        {
          facilityId: memory.facilityId,
          customerPhone: memory.customerPhone,
        },
        'Updated customer memory'
      );
    } catch (error) {
      logger.error(
        { error, facilityId: memory.facilityId, customerPhone: memory.customerPhone },
        'Failed to update customer memory'
      );
    }
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(facilityId: string, customerPhone: string): string {
    const timestamp = Date.now();
    return `${facilityId}-${customerPhone}-${timestamp}`;
  }

  /**
   * Check if conversation is stale (no activity in X hours)
   */
  async isConversationStale(
    facilityId: string,
    customerPhone: string,
    hoursThreshold: number = 2
  ): Promise<boolean> {
    const context = await this.getContext(facilityId, customerPhone);

    const hoursSinceLastMessage =
      (Date.now() - context.lastMessageAt) / (1000 * 60 * 60);

    return hoursSinceLastMessage > hoursThreshold;
  }
}
