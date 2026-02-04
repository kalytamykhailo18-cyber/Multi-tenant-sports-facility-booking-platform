// Intent Detection Service - Detects user intent from messages
import { GeminiService, Intent, type IntentDetectionResult } from './gemini.service';
import { logger } from '../config/logger.config';

export interface ParsedIntent extends IntentDetectionResult {
  requiresAction: boolean; // If true, needs to trigger a handler
  shouldEscalate: boolean; // If true, should escalate to human
}

export class IntentService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Detect intent from customer message
   * Uses Gemini AI for intelligent classification
   */
  async detectIntent(message: string): Promise<ParsedIntent> {
    try {
      logger.debug({ message }, 'Detecting intent');

      // Use Gemini for intent detection
      const detection = await this.geminiService.detectIntent(message);

      // Determine if action is required
      const requiresAction = this.requiresAction(detection.intent);

      // Determine if should escalate
      const shouldEscalate = this.shouldEscalate(detection);

      const parsed: ParsedIntent = {
        ...detection,
        requiresAction,
        shouldEscalate,
      };

      logger.info(
        {
          intent: parsed.intent,
          confidence: parsed.confidence,
          requiresAction: parsed.requiresAction,
          shouldEscalate: parsed.shouldEscalate,
        },
        '✅ Intent parsed'
      );

      return parsed;
    } catch (error) {
      logger.error({ error, message }, '❌ Failed to detect intent');

      // Return safe default
      return {
        intent: Intent.UNKNOWN,
        confidence: 0.3,
        requiresAction: false,
        shouldEscalate: false,
      };
    }
  }

  /**
   * Check if intent requires specific action/handler
   */
  private requiresAction(intent: Intent): boolean {
    const actionableIntents = [
      Intent.BOOKING,
      Intent.AVAILABILITY,
      Intent.CANCELLATION,
      Intent.RESCHEDULE,
      Intent.FIND_OPPONENT,
      Intent.HUMAN_REQUEST,
    ];

    return actionableIntents.includes(intent);
  }

  /**
   * Check if should escalate to human
   */
  private shouldEscalate(detection: IntentDetectionResult): boolean {
    // Always escalate explicit human requests
    if (detection.intent === Intent.HUMAN_REQUEST) {
      return true;
    }

    // Escalate if confidence is very low
    if (detection.confidence < 0.4) {
      logger.warn(
        {
          intent: detection.intent,
          confidence: detection.confidence,
        },
        'Low confidence - may need escalation'
      );
      return false; // Don't auto-escalate on first low confidence
    }

    return false;
  }

  /**
   * Detect patterns in Rioplatense Spanish
   * This is a fallback for when Gemini is unavailable
   */
  detectPatternBased(message: string): ParsedIntent {
    const lowerMessage = message.toLowerCase();

    // Booking patterns
    if (
      /\b(reserv|quiero|busco|necesito|me das|tenés|hay).*(cancha|turno|hora|slot)/i.test(
        message
      ) ||
      /\b(para|el|este).*(hoy|mañana|sábado|domingo|lunes|martes|miércoles|jueves|viernes)/i.test(
        message
      )
    ) {
      return {
        intent: Intent.BOOKING,
        confidence: 0.7,
        requiresAction: true,
        shouldEscalate: false,
      };
    }

    // Availability patterns
    if (
      /\b(qué|que).*(hora|horario|turno|disponible|libre|tenés|hay)/i.test(message) ||
      /\b(disponibilidad|cuándo|cuando)/i.test(message)
    ) {
      return {
        intent: Intent.AVAILABILITY,
        confidence: 0.7,
        requiresAction: true,
        shouldEscalate: false,
      };
    }

    // Cancellation patterns
    if (
      /\b(cancel|anular|suspender|no (voy|puedo|vamos))/i.test(message) ||
      /\b(quiero|necesito).*(cancel|anular)/i.test(message)
    ) {
      return {
        intent: Intent.CANCELLATION,
        confidence: 0.75,
        requiresAction: true,
        shouldEscalate: false,
      };
    }

    // Reschedule patterns
    if (
      /\b(cambiar|cambio|mover|reprogramar|pasar).*(reserva|turno|día|hora)/i.test(message) ||
      /\b(otro|otra).*(día|hora|fecha)/i.test(message)
    ) {
      return {
        intent: Intent.RESCHEDULE,
        confidence: 0.7,
        requiresAction: true,
        shouldEscalate: false,
      };
    }

    // Find opponent patterns
    if (
      /\b(busco|necesito|no (consigo|tengo|encuentro)).*(rival|compañero|jugador|alguien)/i.test(
        message
      ) ||
      /\b(me falta|falta).*(uno|gente|jugador)/i.test(message) ||
      /\b(alguien quiere jugar|quien (juega|se copa))/i.test(message)
    ) {
      return {
        intent: Intent.FIND_OPPONENT,
        confidence: 0.75,
        requiresAction: true,
        shouldEscalate: false,
      };
    }

    // Human request patterns
    if (
      /\b(hablar|atender|persona|humano|dueño|encargado|alguien|empleado)/i.test(message) ||
      /\b(quiero|necesito).*(hablar|que me atiend)/i.test(message) ||
      /\b(reclamo|queja|problema serio)/i.test(message)
    ) {
      return {
        intent: Intent.HUMAN_REQUEST,
        confidence: 0.85,
        requiresAction: true,
        shouldEscalate: true,
      };
    }

    // Greeting patterns
    if (
      /^\s*(hola|buenos días|buen día|buenas tardes|buenas noches|che|ey|hey)\s*[!?.,]?\s*$/i.test(
        message
      )
    ) {
      return {
        intent: Intent.GREETING,
        confidence: 0.95,
        requiresAction: false,
        shouldEscalate: false,
      };
    }

    // General question (default)
    return {
      intent: Intent.GENERAL_QUESTION,
      confidence: 0.5,
      requiresAction: false,
      shouldEscalate: false,
    };
  }

  /**
   * Extract entities from message (dates, times, etc.)
   * TODO: Enhance with more sophisticated extraction
   */
  extractEntities(
    message: string
  ): IntentDetectionResult['entities'] {
    const entities: IntentDetectionResult['entities'] = {};

    // Extract date references
    if (/\bhoy\b/i.test(message)) {
      entities.date = 'hoy';
    } else if (/\bmañana\b/i.test(message)) {
      entities.date = 'mañana';
    }

    // Extract time (simplified - can be enhanced)
    const timeMatch = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(hs|hrs|horas?)?\b/i);
    if (timeMatch) {
      const hour = timeMatch[1];
      const minute = timeMatch[2] || '00';
      entities.time = `${hour.padStart(2, '0')}:${minute}`;
    }

    // Extract sport type
    if (/\b(fútbol|futbol|soccer|cancha)\b/i.test(message)) {
      entities.sportType = 'SOCCER';
    } else if (/\bpadel\b/i.test(message)) {
      entities.sportType = 'PADEL';
    } else if (/\btenis\b/i.test(message)) {
      entities.sportType = 'TENNIS';
    }

    // Extract level
    if (/\b(principiante|novato|nuevo)\b/i.test(message)) {
      entities.level = 'principiante';
    } else if (/\b(intermedio|medio)\b/i.test(message)) {
      entities.level = 'intermedio';
    } else if (/\b(avanzado|profesional|pro)\b/i.test(message)) {
      entities.level = 'avanzado';
    }

    return entities;
  }
}
