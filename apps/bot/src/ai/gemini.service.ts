// Gemini AI Service - Generates responses using Google Gemini
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { envConfig } from '../config/env.config';
import { logger } from '../config/logger.config';
import { createSystemPrompt, type FacilityContext } from './prompts/system.prompt';
import { createBookingPrompt, createAvailabilityPrompt } from './prompts/booking.prompt';
import {
  createCancellationPrompt,
  createReschedulePrompt,
} from './prompts/cancellation.prompt';
import {
  createGeneralPrompt,
  createFindOpponentPrompt,
  createEscalationPrompt,
} from './prompts/general.prompt';

export enum Intent {
  BOOKING = 'BOOKING',
  AVAILABILITY = 'AVAILABILITY',
  CANCELLATION = 'CANCELLATION',
  RESCHEDULE = 'RESCHEDULE',
  FIND_OPPONENT = 'FIND_OPPONENT',
  GENERAL_QUESTION = 'GENERAL_QUESTION',
  HUMAN_REQUEST = 'HUMAN_REQUEST',
  GREETING = 'GREETING',
  UNKNOWN = 'UNKNOWN',
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntentDetectionResult {
  intent: Intent;
  confidence: number; // 0-1
  entities?: {
    date?: string;
    time?: string;
    sportType?: string;
    level?: string;
  };
}

export interface GenerateResponseOptions {
  facilityContext: FacilityContext;
  conversationHistory: ConversationMessage[];
  currentMessage: string;
  intent?: Intent;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate AI response for customer message
   */
  async generateResponse(options: GenerateResponseOptions): Promise<string> {
    const { facilityContext, conversationHistory, currentMessage, intent } = options;

    try {
      // Build the full prompt
      const systemPrompt = createSystemPrompt(facilityContext);
      const contextPrompt = this.buildContextPrompt(intent);

      // Format conversation history for Gemini
      const conversationText = this.formatConversationHistory(conversationHistory);

      const fullPrompt = `${systemPrompt}

${contextPrompt}

## CONVERSACIÓN HASTA AHORA:
${conversationText}

## MENSAJE ACTUAL DEL CLIENTE:
${currentMessage}

## TU RESPUESTA (en español rioplatense, natural y concisa):`;

      logger.debug(
        {
          messageLength: currentMessage.length,
          historyLength: conversationHistory.length,
          intent,
        },
        'Generating Gemini response'
      );

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response.text();

      logger.info(
        {
          inputLength: currentMessage.length,
          outputLength: response.length,
          intent,
        },
        '✅ Gemini response generated'
      );

      return response.trim();
    } catch (error) {
      logger.error({ error, currentMessage }, '❌ Failed to generate Gemini response');
      // Fallback response
      return 'Disculpá, tuve un problemita técnico. ¿Podés repetir lo que necesitás?';
    }
  }

  /**
   * Detect intent from customer message
   */
  async detectIntent(message: string): Promise<IntentDetectionResult> {
    try {
      const prompt = `Analizá este mensaje de un cliente de una cancha deportiva y determiná la intención:

MENSAJE: "${message}"

Respondé SOLO con un JSON en este formato exacto:
{
  "intent": "BOOKING" | "AVAILABILITY" | "CANCELLATION" | "RESCHEDULE" | "FIND_OPPONENT" | "GENERAL_QUESTION" | "HUMAN_REQUEST" | "GREETING" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "entities": {
    "date": "hoy|mañana|YYYY-MM-DD",
    "time": "HH:MM",
    "sportType": "SOCCER|PADEL|TENNIS",
    "level": "principiante|intermedio|avanzado"
  }
}

INTENCIONES:
- BOOKING: Quiere hacer una reserva
- AVAILABILITY: Pregunta qué horarios hay disponibles
- CANCELLATION: Quiere cancelar una reserva
- RESCHEDULE: Quiere cambiar fecha/hora de reserva
- FIND_OPPONENT: Busca rival/compañero para jugar
- GENERAL_QUESTION: Pregunta general (precio, ubicación, servicios)
- HUMAN_REQUEST: Pide hablar con una persona
- GREETING: Saludo inicial
- UNKNOWN: No se entiende la intención

Ejemplos:
"Quiero reservar para mañana" → BOOKING, 0.95
"Qué horarios tenés el sábado" → AVAILABILITY, 0.9
"Necesito cancelar" → CANCELLATION, 0.95
"Hola" → GREETING, 1.0
"Busco rival" → FIND_OPPONENT, 0.9`;

      logger.debug({ message }, 'Detecting intent');

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const detection: IntentDetectionResult = JSON.parse(jsonMatch[0]);

      logger.info(
        {
          message,
          intent: detection.intent,
          confidence: detection.confidence,
        },
        '✅ Intent detected'
      );

      return detection;
    } catch (error) {
      logger.error({ error, message }, '❌ Failed to detect intent');

      // Default to unknown with low confidence
      return {
        intent: Intent.UNKNOWN,
        confidence: 0.3,
      };
    }
  }

  /**
   * Build context-specific prompt based on intent
   */
  private buildContextPrompt(intent?: Intent): string {
    if (!intent || intent === Intent.UNKNOWN) {
      return createGeneralPrompt();
    }

    switch (intent) {
      case Intent.BOOKING:
        return createBookingPrompt();
      case Intent.AVAILABILITY:
        return createAvailabilityPrompt();
      case Intent.CANCELLATION:
        return createCancellationPrompt();
      case Intent.RESCHEDULE:
        return createReschedulePrompt();
      case Intent.FIND_OPPONENT:
        return createFindOpponentPrompt();
      case Intent.HUMAN_REQUEST:
        return createEscalationPrompt();
      case Intent.GENERAL_QUESTION:
      case Intent.GREETING:
      default:
        return createGeneralPrompt();
    }
  }

  /**
   * Format conversation history for prompt
   */
  private formatConversationHistory(history: ConversationMessage[]): string {
    if (history.length === 0) {
      return '(No hay conversación previa)';
    }

    return history
      .map((msg) => {
        const role = msg.role === 'user' ? 'CLIENTE' : 'VOS';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * Check if Gemini API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hola');
      return !!result.response.text();
    } catch (error) {
      logger.error({ error }, 'Gemini health check failed');
      return false;
    }
  }
}
