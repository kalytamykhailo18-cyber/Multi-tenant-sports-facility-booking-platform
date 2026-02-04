// WhatsApp Service - Handles sending and receiving WhatsApp messages
import { WhatsAppConnectionService } from './connection.service';
import { QueueService } from '../queue/queue.service';
import { logger } from '../config/logger.config';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export class WhatsAppService {
  constructor(
    private connectionService: WhatsAppConnectionService,
    private queueService: QueueService
  ) {}

  /**
   * Send text message to customer
   */
  async sendTextMessage(facilityId: string, to: string, text: string): Promise<void> {
    logger.info({ facilityId, to, messageLength: text.length }, 'Sending text message');

    const socket = this.connectionService.getSocket(facilityId);
    if (!socket) {
      throw new Error(`Facility ${facilityId} not connected to WhatsApp`);
    }

    try {
      // Format phone number (ensure it's in WhatsApp format: countrycode@s.whatsapp.net)
      const jid = this.formatPhoneNumber(to);

      await socket.sendMessage(jid, { text });

      logger.info({ facilityId, to }, '✅ Text message sent successfully');
    } catch (error) {
      logger.error({ error, facilityId, to }, '❌ Failed to send text message');
      throw error;
    }
  }

  /**
   * Send image message with caption
   */
  async sendImageMessage(
    facilityId: string,
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<void> {
    logger.info({ facilityId, to, imageUrl }, 'Sending image message');

    const socket = this.connectionService.getSocket(facilityId);
    if (!socket) {
      throw new Error(`Facility ${facilityId} not connected to WhatsApp`);
    }

    try {
      const jid = this.formatPhoneNumber(to);

      await socket.sendMessage(jid, {
        image: { url: imageUrl },
        caption: caption || '',
      });

      logger.info({ facilityId, to }, '✅ Image message sent successfully');
    } catch (error) {
      logger.error({ error, facilityId, to }, '❌ Failed to send image message');
      throw error;
    }
  }

  /**
   * Send payment link message
   */
  async sendPaymentLink(
    facilityId: string,
    to: string,
    paymentLink: string,
    message: string
  ): Promise<void> {
    logger.info({ facilityId, to }, 'Sending payment link');

    const fullMessage = `${message}\n\n💳 Link de pago: ${paymentLink}`;

    await this.sendTextMessage(facilityId, to, fullMessage);
  }

  /**
   * Download media from message (for voice notes)
   */
  async downloadMedia(facilityId: string, message: any): Promise<Buffer> {
    logger.info({ facilityId, messageType: message.type }, 'Downloading media');

    const socket = this.connectionService.getSocket(facilityId);
    if (!socket) {
      throw new Error(`Facility ${facilityId} not connected to WhatsApp`);
    }

    try {
      const buffer = await downloadMediaMessage(message, 'buffer', {});

      logger.info(
        { facilityId, messageType: message.type, size: buffer.length },
        '✅ Media downloaded'
      );

      return buffer as Buffer;
    } catch (error) {
      logger.error({ error, facilityId }, '❌ Failed to download media');
      throw error;
    }
  }

  /**
   * Setup message handlers for incoming messages
   */
  setupMessageHandlers(facilityId: string): void {
    const socket = this.connectionService.getSocket(facilityId);
    if (!socket) {
      logger.warn({ facilityId }, 'Cannot setup handlers - not connected');
      return;
    }

    // Listen for incoming messages
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return; // Only process new messages

      for (const msg of messages) {
        // Skip messages from ourselves
        if (msg.key.fromMe) continue;

        // Skip group messages (only handle 1-on-1)
        if (msg.key.remoteJid?.endsWith('@g.us')) continue;

        try {
          const from = msg.key.remoteJid!;
          const timestamp = msg.messageTimestamp as number;

          // Extract message content
          let messageText = '';
          let messageType: 'text' | 'audio' | 'image' = 'text';
          let mediaUrl: string | undefined;

          if (msg.message?.conversation) {
            messageText = msg.message.conversation;
            messageType = 'text';
          } else if (msg.message?.extendedTextMessage?.text) {
            messageText = msg.message.extendedTextMessage.text;
            messageType = 'text';
          } else if (msg.message?.audioMessage) {
            messageType = 'audio';
            // Audio will be downloaded by processor
            logger.info({ facilityId, from }, 'Received audio message');
          } else if (msg.message?.imageMessage) {
            messageType = 'image';
            messageText = msg.message.imageMessage.caption || '';
            logger.info({ facilityId, from }, 'Received image message');
          }

          // Add to incoming messages queue for processing
          await this.queueService.addIncomingMessage({
            facilityId,
            from: this.stripPhoneNumber(from),
            message: messageText,
            messageType,
            mediaUrl,
            timestamp,
          });

          logger.info(
            { facilityId, from, messageType },
            '📨 Incoming message queued for processing'
          );
        } catch (error) {
          logger.error(
            { error, facilityId, msgKey: msg.key },
            'Failed to process incoming message'
          );
        }
      }
    });

    logger.info({ facilityId }, '✅ Message handlers setup complete');
  }

  /**
   * Format phone number to WhatsApp JID format
   * Example: "5491112345678" -> "5491112345678@s.whatsapp.net"
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Add @s.whatsapp.net if not present
    if (!cleaned.endsWith('@s.whatsapp.net')) {
      return `${cleaned}@s.whatsapp.net`;
    }

    return cleaned;
  }

  /**
   * Strip WhatsApp JID to get clean phone number
   * Example: "5491112345678@s.whatsapp.net" -> "5491112345678"
   */
  private stripPhoneNumber(jid: string): string {
    return jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  }
}
