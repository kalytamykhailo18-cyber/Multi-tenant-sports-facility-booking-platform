// Phone utility functions for Argentine phone numbers
// Handles formatting and normalization

/**
 * Formats an Argentine phone number for display
 * @param phone - Raw phone number (with or without country code)
 * @returns Formatted phone string
 *
 * Examples:
 * - "1123456789" → "+54 11 2345-6789"
 * - "5491123456789" → "+54 9 11 2345-6789"
 * - "541123456789" → "+54 11 2345-6789"
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.length === 10) {
    // Local format: 1123456789
    // Format: +54 11 2345-6789
    const areaCode = digits.slice(0, 2);
    const firstPart = digits.slice(2, 6);
    const secondPart = digits.slice(6, 10);
    return `+54 ${areaCode} ${firstPart}-${secondPart}`;
  } else if (digits.length === 13 && digits.startsWith('549')) {
    // Full format with mobile indicator: 5491123456789
    // Format: +54 9 11 2345-6789
    const areaCode = digits.slice(3, 5);
    const firstPart = digits.slice(5, 9);
    const secondPart = digits.slice(9, 13);
    return `+54 9 ${areaCode} ${firstPart}-${secondPart}`;
  } else if (digits.length === 12 && digits.startsWith('54')) {
    // Full format without mobile indicator: 541123456789
    // Format: +54 11 2345-6789
    const areaCode = digits.slice(2, 4);
    const firstPart = digits.slice(4, 8);
    const secondPart = digits.slice(8, 12);
    return `+54 ${areaCode} ${firstPart}-${secondPart}`;
  }

  // Return original if format unknown
  return phone;
}

/**
 * Normalizes phone number to E.164 format for WhatsApp/storage
 * @param phone - Raw phone number
 * @returns Normalized phone number with country code
 *
 * Examples:
 * - "1123456789" → "5491123456789"
 * - "11 2345-6789" → "5491123456789"
 * - "+54 9 11 2345-6789" → "5491123456789"
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If already in full format with mobile indicator
  if (digits.length === 13 && digits.startsWith('549')) {
    return digits;
  }

  // If in full format without mobile indicator
  if (digits.length === 12 && digits.startsWith('54')) {
    // Add mobile indicator after country code
    return '549' + digits.slice(2);
  }

  // If local format (10 digits)
  if (digits.length === 10) {
    // Add country code + mobile indicator
    return '549' + digits;
  }

  // If 11 digits starting with 0 (old format)
  if (digits.length === 11 && digits.startsWith('0')) {
    // Remove leading 0, add country code + mobile indicator
    return '549' + digits.slice(1);
  }

  // Return as-is if format unknown
  return digits;
}

/**
 * Checks if a phone number is a valid Argentine mobile number
 * @param phone - Phone number to validate
 * @returns True if valid Argentine mobile number
 */
export function isValidArgentinePhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);

  // Must be 13 digits starting with 549
  if (normalized.length !== 13 || !normalized.startsWith('549')) {
    return false;
  }

  // Area code must be valid (11 for Buenos Aires, or other valid codes)
  const areaCode = normalized.slice(3, 5);
  const validAreaCodes = [
    '11', // Buenos Aires
    '221', '223', '237', // Buenos Aires Province
    '261', '263', // Mendoza
    '351', '353', '358', // Córdoba
    '341', '342', '343', // Santa Fe / Rosario
    // Add more as needed
  ];

  return validAreaCodes.some(code => areaCode.startsWith(code.slice(0, 2)));
}

/**
 * Formats phone for WhatsApp link (wa.me format)
 * @param phone - Phone number
 * @returns WhatsApp-ready phone number
 *
 * Example: "1123456789" → "5491123456789"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  return normalizePhoneNumber(phone);
}

/**
 * Formats phone for display in links (tel: protocol)
 * @param phone - Phone number
 * @returns Phone number for tel: links
 *
 * Example: "1123456789" → "+5491123456789"
 */
export function formatPhoneForTel(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return '+' + normalized;
}
