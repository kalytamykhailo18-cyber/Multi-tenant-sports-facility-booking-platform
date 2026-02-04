// Whisper Service - Transcribes audio messages using OpenAI Whisper
import OpenAI from 'openai';
import { envConfig } from '../config/env.config';
import { logger } from '../config/logger.config';
import { Readable } from 'stream';

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  confidence?: number;
}

export interface TranscriptionOptions {
  language?: string; // e.g., 'es' for Spanish
  prompt?: string; // Optional context for better accuracy
}

export class WhisperService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: envConfig.OPENAI_API_KEY,
    });
  }

  /**
   * Transcribe audio buffer to text
   * @param audioBuffer Audio data as Buffer
   * @param options Transcription options
   * @returns Transcription result
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      logger.info(
        {
          audioSize: audioBuffer.length,
          language: options?.language,
        },
        '🎤 Transcribing audio with Whisper'
      );

      // Convert buffer to File-like object
      const audioFile = this.bufferToFile(audioBuffer, 'audio.ogg');

      // Call Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options?.language || 'es', // Default to Spanish
        prompt: options?.prompt, // Optional context
        response_format: 'verbose_json', // Get detailed response with confidence
      });

      const result: TranscriptionResult = {
        text: transcription.text.trim(),
        language: transcription.language,
        duration: transcription.duration,
      };

      logger.info(
        {
          textLength: result.text.length,
          language: result.language,
          duration: result.duration,
        },
        '✅ Audio transcribed successfully'
      );

      return result;
    } catch (error) {
      logger.error(
        {
          error,
          audioSize: audioBuffer.length,
        },
        '❌ Failed to transcribe audio'
      );
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Transcribe audio with retry logic for failed transcriptions
   * @param audioBuffer Audio data
   * @param maxAttempts Maximum number of attempts (default: 2)
   * @returns Transcription result or null if all attempts fail
   */
  async transcribeWithRetry(
    audioBuffer: Buffer,
    maxAttempts: number = 2
  ): Promise<TranscriptionResult | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.debug({ attempt, maxAttempts }, 'Transcription attempt');

        const result = await this.transcribeAudio(audioBuffer, {
          language: 'es',
          prompt: 'Conversación sobre reservas de canchas deportivas en Argentina.',
        });

        // Check if transcription is meaningful (not just noise)
        if (this.isValidTranscription(result.text)) {
          return result;
        }

        logger.warn(
          {
            attempt,
            text: result.text,
          },
          'Transcription seems invalid, retrying'
        );
      } catch (error) {
        logger.error(
          {
            error,
            attempt,
            maxAttempts,
          },
          'Transcription attempt failed'
        );

        // If last attempt, throw error
        if (attempt === maxAttempts) {
          return null;
        }

        // Wait before retry (exponential backoff)
        await this.sleep(1000 * attempt);
      }
    }

    return null;
  }

  /**
   * Check if transcription result is valid (not just noise)
   */
  private isValidTranscription(text: string): boolean {
    // Remove whitespace and check length
    const cleaned = text.trim();

    // Too short (likely noise)
    if (cleaned.length < 3) {
      return false;
    }

    // Check if contains at least one letter
    if (!/[a-záéíóúñ]/i.test(cleaned)) {
      return false;
    }

    // Check for common noise patterns
    const noisePatterns = [
      /^[.\s,!?]+$/, // Only punctuation
      /^(uh|ah|eh|mm|hmm)+$/i, // Just hesitation sounds
    ];

    for (const pattern of noisePatterns) {
      if (pattern.test(cleaned)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Estimate confidence based on transcription quality
   * Note: Whisper doesn't provide confidence scores, so we estimate
   */
  estimateConfidence(result: TranscriptionResult): number {
    const text = result.text.trim();

    // Very short transcriptions are less reliable
    if (text.length < 5) {
      return 0.4;
    }

    // Check for incomplete words or excessive punctuation
    const wordCount = text.split(/\s+/).length;
    const punctuationCount = (text.match(/[.,!?]/g) || []).length;

    if (punctuationCount > wordCount * 0.5) {
      return 0.5; // Too much punctuation, might be noisy
    }

    // If text is coherent and has reasonable length
    if (wordCount >= 3) {
      return 0.85;
    }

    return 0.7; // Default moderate confidence
  }

  /**
   * Convert Buffer to File-like object for OpenAI API
   */
  private bufferToFile(buffer: Buffer, filename: string): File {
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: 'audio/ogg' });

    // Create a File from the Blob
    return new File([blob], filename, { type: 'audio/ogg' });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check for Whisper API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Create a minimal audio file for testing (silence)
      const silenceBuffer = Buffer.alloc(1024);

      await this.transcribeAudio(silenceBuffer);
      return true;
    } catch (error) {
      logger.error({ error }, 'Whisper health check failed');
      return false;
    }
  }
}
