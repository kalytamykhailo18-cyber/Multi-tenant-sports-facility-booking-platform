// Human Simulation Service - Anti-Block Protection
// Simulates human typing behavior to prevent WhatsApp from detecting and blocking the bot

import { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../config/logger.config';

export interface HumanSimulationConfig {
  baseDelayMin: number; // Minimum base delay in ms (default: 3000)
  baseDelayMax: number; // Maximum base delay in ms (default: 5000)
  charDelayMs: number; // Delay per character in ms (default: 50)
  randomVariance: number; // Random variance in ms (default: 500)
}

const DEFAULT_CONFIG: HumanSimulationConfig = {
  baseDelayMin: 3000,
  baseDelayMax: 5000,
  charDelayMs: 50,
  randomVariance: 500,
};

export class HumanSimulationService {
  /**
   * Calculate total delay for a message based on length
   * Formula: baseDelay + (charCount * charDelayMs) + randomVariance
   */
  calculateDelay(
    messageLength: number,
    config: HumanSimulationConfig = DEFAULT_CONFIG
  ): number {
    // Base delay (random between min and max)
    const baseDelay =
      Math.random() * (config.baseDelayMax - config.baseDelayMin) + config.baseDelayMin;

    // Typing delay based on message length
    const typingDelay = messageLength * config.charDelayMs;

    // Random variance (±randomVariance)
    const variance = (Math.random() - 0.5) * 2 * config.randomVariance;

    const totalDelay = Math.max(baseDelay + typingDelay + variance, 1000); // Minimum 1 second

    logger.debug(
      {
        messageLength,
        baseDelay: Math.round(baseDelay),
        typingDelay,
        variance: Math.round(variance),
        totalDelay: Math.round(totalDelay),
      },
      'Calculated human simulation delay'
    );

    return totalDelay;
  }

  /**
   * Send "composing" presence (shows "Typing..." to customer)
   */
  async sendComposingPresence(socket: WASocket, jid: string): Promise<void> {
    try {
      await socket.presenceSubscribe(jid);
      await socket.sendPresenceUpdate('composing', jid);

      logger.debug({ jid }, 'Sent composing presence (typing...)');
    } catch (error) {
      logger.warn({ error, jid }, 'Failed to send composing presence');
      // Don't throw - presence is not critical
    }
  }

  /**
   * Send "paused" presence (stops "Typing..." indicator)
   */
  async sendPausedPresence(socket: WASocket, jid: string): Promise<void> {
    try {
      await socket.sendPresenceUpdate('paused', jid);

      logger.debug({ jid }, 'Sent paused presence');
    } catch (error) {
      logger.warn({ error, jid }, 'Failed to send paused presence');
      // Don't throw - presence is not critical
    }
  }

  /**
   * Apply full human simulation before sending message
   * Returns the delay applied (for logging/metrics)
   */
  async applySimulation(
    socket: WASocket,
    jid: string,
    messageLength: number,
    config?: HumanSimulationConfig
  ): Promise<number> {
    const effectiveConfig = config || DEFAULT_CONFIG;

    // Step 1: Calculate delay
    const delay = this.calculateDelay(messageLength, effectiveConfig);

    logger.info(
      { jid, messageLength, delay: Math.round(delay) },
      '⏳ Applying human simulation'
    );

    // Step 2: Show "Typing..." status
    await this.sendComposingPresence(socket, jid);

    // Step 3: Wait (simulating typing time)
    await this.sleep(delay);

    // Step 4: Stop "Typing..." (message will be sent immediately after)
    await this.sendPausedPresence(socket, jid);

    return delay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get facility-specific configuration
   * TODO Phase 7: Load from database (Facility settings)
   */
  async getFacilityConfig(facilityId: string): Promise<HumanSimulationConfig> {
    // TODO: Load from database
    // For now, return default config
    logger.debug({ facilityId }, 'Using default human simulation config');
    return DEFAULT_CONFIG;
  }

  /**
   * Add small "reading" delay before responding
   * Simulates human reading incoming message (500-1500ms)
   */
  async applyReadingDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    logger.debug({ delay: Math.round(delay) }, 'Applying reading delay');
    await this.sleep(delay);
  }
}
