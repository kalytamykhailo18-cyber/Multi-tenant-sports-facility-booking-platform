// Encryption Service
// Handles encryption/decryption of sensitive data (API credentials)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Get encryption key from environment variable
    // Should be 32 bytes (256 bits) for AES-256
    const key = this.configService.get<string>('ENCRYPTION_KEY');

    if (!key) {
      this.logger.warn(
        'ENCRYPTION_KEY not set. Using a derived key from JWT_SECRET. ' +
        'For production, set a dedicated ENCRYPTION_KEY environment variable.'
      );
      // Fallback to deriving from JWT_SECRET
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
      this.encryptionKey = crypto.scryptSync(jwtSecret, 'salt', 32);
    } else {
      // Use the provided key (should be base64 encoded 32 bytes)
      this.encryptionKey = Buffer.from(key, 'base64');
      if (this.encryptionKey.length !== 32) {
        this.logger.warn('ENCRYPTION_KEY should be 32 bytes. Deriving a proper key.');
        this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
      }
    }
  }

  /**
   * Encrypt a string value
   * Returns a string in format: iv:authTag:encryptedData (all base64)
   */
  encrypt(plainText: string): string {
    if (!plainText) return '';

    try {
      // Generate a random IV (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt the data
      let encrypted = cipher.update(plainText, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get the auth tag (GCM authentication)
      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and encrypted data
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string value
   * Input should be in format: iv:authTag:encryptedData (all base64)
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
      // Split the stored value
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, encryptedData] = parts;

      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if a value appears to be encrypted (has the expected format)
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3;
  }

  /**
   * Encrypt a value only if it's not already encrypted
   */
  encryptIfNeeded(value: string): string {
    if (!value) return '';
    if (this.isEncrypted(value)) return value;
    return this.encrypt(value);
  }

  /**
   * Mask a sensitive value for display (e.g., "sk-xxx...xxxx")
   */
  mask(value: string, visibleChars: number = 4): string {
    if (!value) return '';
    if (value.length <= visibleChars * 2) {
      return '*'.repeat(value.length);
    }
    return `${value.substring(0, visibleChars)}...${value.substring(value.length - visibleChars)}`;
  }
}
