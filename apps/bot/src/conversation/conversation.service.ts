// Conversation Service - Orchestrates conversation flow with AI
import { ContextService, type ConversationContext } from './context.service';
import { HumanTakeoverService } from './takeover.service';
import { GeminiService, Intent } from '../ai/gemini.service';
import { WhisperService } from '../ai/whisper.service';
import { IntentService } from '../ai/intent.service';
import { getDatabaseClient } from '../config/database.config';
import { logger } from '../config/logger.config';
import type { FacilityContext } from '../ai/prompts/system.prompt';

export interface ProcessMessageOptions {
  facilityId: string;
  customerPhone: string;
  message: string;
  messageType: 'text' | 'audio' | 'image';
  audioBuffer?: Buffer;
  mediaUrl?: string;
}

export interface ProcessMessageResult {
  shouldRespond: boolean;
  response?: string;
  intent?: Intent;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export class ConversationService {
  private contextService: ContextService;
  private takeoverService: HumanTakeoverService;
  private geminiService: GeminiService;
  private whisperService: WhisperService;
  private intentService: IntentService;
  private db = getDatabaseClient();

  constructor() {
    this.contextService = new ContextService();
    this.takeoverService = new HumanTakeoverService();
    this.geminiService = new GeminiService();
    this.whisperService = new WhisperService();
    this.intentService = new IntentService();
  }

  /**
   * Process incoming message and generate response
   */
  async processMessage(options: ProcessMessageOptions): Promise<ProcessMessageResult> {
    const { facilityId, customerPhone, message, messageType, audioBuffer } = options;

    try {
      logger.info(
        {
          facilityId,
          customerPhone,
          messageType,
          messageLength: message.length,
        },
        '💬 Processing conversation message'
      );

      // Step 1: Check human takeover status
      const takeoverStatus = await this.takeoverService.isTakeoverActive(
        facilityId,
        customerPhone
      );

      if (takeoverStatus.isActive) {
        logger.info(
          {
            facilityId,
            customerPhone,
            remainingMinutes: takeoverStatus.remainingMinutes,
          },
          '🔇 Human takeover active - skipping bot response'
        );

        return {
          shouldRespond: false,
          shouldEscalate: false,
        };
      }

      // Step 2: Handle audio messages (transcribe with Whisper)
      let processedMessage = message;

      if (messageType === 'audio' && audioBuffer) {
        const transcription = await this.whisperService.transcribeWithRetry(audioBuffer);

        if (!transcription) {
          // Failed to transcribe after retries
          const failedAttempts = await this.contextService.incrementFailedAttempts(
            facilityId,
            customerPhone
          );

          logger.warn(
            {
              facilityId,
              customerPhone,
              failedAttempts,
            },
            '❌ Audio transcription failed'
          );

          // Escalate after 2 failed audio attempts
          if (failedAttempts >= 2) {
            return {
              shouldRespond: true,
              response:
                'Disculpá, no logro entender el audio. ¿Podés escribirme o te paso con alguien del equipo?',
              shouldEscalate: true,
              escalationReason: 'Failed audio transcription after 2 attempts',
            };
          }

          return {
            shouldRespond: true,
            response:
              'Perdón, no pude escuchar bien el audio. ¿Podés enviarlo de nuevo o escribirme?',
            shouldEscalate: false,
          };
        }

        processedMessage = transcription.text;
        logger.info(
          {
            facilityId,
            customerPhone,
            transcription: processedMessage,
          },
          '✅ Audio transcribed successfully'
        );

        // Reset failed attempts on successful transcription
        await this.contextService.resetFailedAttempts(facilityId, customerPhone);
      }

      // Step 3: Get or create conversation context
      const context = await this.contextService.getContext(facilityId, customerPhone);

      // Step 4: Add customer message to history
      await this.contextService.addMessage(facilityId, customerPhone, 'user', processedMessage);

      // Step 5: Detect intent
      const parsedIntent = await this.intentService.detectIntent(processedMessage);

      logger.info(
        {
          facilityId,
          customerPhone,
          intent: parsedIntent.intent,
          confidence: parsedIntent.confidence,
        },
        '🎯 Intent detected'
      );

      // Step 6: Check if should escalate
      if (parsedIntent.shouldEscalate) {
        // Update context with intent
        await this.contextService.updateIntent(
          facilityId,
          customerPhone,
          parsedIntent.intent
        );

        return {
          shouldRespond: true,
          response: 'Entendido, te paso con el equipo. En un momento te atienden 👤',
          intent: parsedIntent.intent,
          shouldEscalate: true,
          escalationReason: 'Customer requested human assistance',
        };
      }

      // Step 7: Load facility context for AI
      const facilityContext = await this.getFacilityContext(facilityId);

      // Step 8: Generate AI response
      const response = await this.geminiService.generateResponse({
        facilityContext,
        conversationHistory: context.messages,
        currentMessage: processedMessage,
        intent: parsedIntent.intent,
      });

      // Step 9: Add bot response to history
      await this.contextService.addMessage(facilityId, customerPhone, 'assistant', response);

      // Step 10: Update context with current intent
      await this.contextService.updateIntent(facilityId, customerPhone, parsedIntent.intent);

      logger.info(
        {
          facilityId,
          customerPhone,
          intent: parsedIntent.intent,
          responseLength: response.length,
        },
        '✅ Generated bot response'
      );

      return {
        shouldRespond: true,
        response,
        intent: parsedIntent.intent,
        shouldEscalate: false,
      };
    } catch (error) {
      logger.error(
        {
          error,
          facilityId,
          customerPhone,
        },
        '❌ Failed to process message'
      );

      // Return fallback response
      return {
        shouldRespond: true,
        response:
          'Disculpá, tuve un problemita técnico. ¿Podés repetir lo que necesitás?',
        shouldEscalate: false,
      };
    }
  }

  /**
   * Get facility context for AI prompts
   */
  private async getFacilityContext(facilityId: string): Promise<FacilityContext> {
    try {
      const facility = await this.db.facility.findUnique({
        where: { id: facilityId },
        include: {
          courts: {
            select: {
              sportType: true,
            },
          },
        },
      });

      if (!facility) {
        throw new Error(`Facility not found: ${facilityId}`);
      }

      // Get unique sport types
      const sportTypes = [...new Set(facility.courts.map((c) => c.sportType))];

      // Build operating hours string
      const operatingHours = 'Lunes a Domingo de 8:00 a 23:00'; // TODO: Load from OperatingHours

      // Build price range string
      const priceRange = 'Desde $3000/hora'; // TODO: Calculate from court prices

      const context: FacilityContext = {
        name: facility.name,
        address: facility.address,
        phone: facility.phone,
        sportTypes,
        operatingHours,
        priceRange,
      };

      return context;
    } catch (error) {
      logger.error({ error, facilityId }, 'Failed to load facility context');

      // Return minimal context
      return {
        name: 'la cancha',
        address: 'dirección no disponible',
        phone: 'teléfono no disponible',
        sportTypes: ['SOCCER'],
        operatingHours: 'Consultar horarios',
        priceRange: 'Consultar precios',
      };
    }
  }

  /**
   * Handle "book same as last time" request
   */
  async handleRepeatBooking(
    facilityId: string,
    customerPhone: string
  ): Promise<string> {
    try {
      const memory = await this.contextService.getCustomerMemory(
        facilityId,
        customerPhone
      );

      if (!memory?.lastBooking) {
        return 'No tengo registro de tu última reserva. ¿Querés hacer una nueva?';
      }

      const { courtName, timeSlot, price } = memory.lastBooking;

      return `Claro! Tu última reserva fue ${courtName} a las ${timeSlot}. ¿Querés reservar lo mismo?`;
    } catch (error) {
      logger.error({ error, facilityId, customerPhone }, 'Failed to handle repeat booking');
      return 'Tuve un problema al buscar tu última reserva. ¿Me decís qué querés reservar?';
    }
  }

  /**
   * Clear conversation (end session)
   */
  async endConversation(facilityId: string, customerPhone: string): Promise<void> {
    await this.contextService.clearContext(facilityId, customerPhone);
    logger.info({ facilityId, customerPhone }, 'Conversation ended');
  }
}
