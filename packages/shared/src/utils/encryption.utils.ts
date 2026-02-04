// Encryption utilities for sensitive data
// Uses AES-256-GCM for encrypting OAuth tokens and WhatsApp session data

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from password and salt
 * @param password - Encryption password from environment
 * @param salt - Salt for key derivation
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @param password - Encryption password from environment
 * @returns Encrypted string with format: salt:iv:authTag:encryptedData
 */
export async function encrypt(text: string, password: string): Promise<string> {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }
  if (!password) {
    throw new Error('Encryption password is required');
  }

  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from password and salt
  const key = await deriveKey(password, salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine salt:iv:authTag:encryptedData
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param encryptedText - Encrypted string with format: salt:iv:authTag:encryptedData
 * @param password - Encryption password from environment
 * @returns Decrypted plain text
 */
export async function decrypt(encryptedText: string, password: string): Promise<string> {
  if (!encryptedText) {
    throw new Error('Encrypted text cannot be empty');
  }
  if (!password) {
    throw new Error('Encryption password is required');
  }

  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted text format');
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;

    // Convert hex strings back to buffers
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Derive key from password and salt
    const key = await deriveKey(password, salt);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string appears to be encrypted
 * @param text - Text to check
 * @returns True if text matches encrypted format
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(':');
  return parts.length === 4 && parts.every((part) => /^[0-9a-f]+$/.test(part));
}

/**
 * Safely encrypt only if not already encrypted
 * @param text - Plain text to encrypt
 * @param password - Encryption password from environment
 * @returns Encrypted text or original if already encrypted
 */
export async function safeEncrypt(text: string, password: string): Promise<string> {
  if (isEncrypted(text)) {
    return text;
  }
  return encrypt(text, password);
}

/**
 * Safely decrypt only if encrypted
 * @param text - Text to decrypt
 * @param password - Encryption password from environment
 * @returns Decrypted text or original if not encrypted
 */
export async function safeDecrypt(text: string, password: string): Promise<string> {
  if (!isEncrypted(text)) {
    return text;
  }
  return decrypt(text, password);
}
