// Facility related types
// Types for facility and court management

import type { Facility, Court, FacilityStatus, CourtStatus, SportType } from '@sports-booking/database';
import type { CurrencyCode } from '../utils/currency.utils';

// Facility without sensitive credentials - safe for API responses
export type SafeFacility = Omit<
  Facility,
  | 'whatsappApiKey'
  | 'whatsappApiSecret'
  | 'whatsappWebhookToken'
  | 'mercadopagoAccessToken'
  | 'mercadopagoPublicKey'
  | 'geminiApiKey'
  | 'whisperApiKey'
>;

// Facility with credential status (indicates if configured, but not actual values)
export interface FacilityWithCredentialStatus extends SafeFacility {
  hasWhatsappCredentials: boolean;
  hasMercadopagoCredentials: boolean;
  hasAiCredentials: boolean;
}

// Create facility input
export interface CreateFacilityInput {
  tenantId?: string; // Required for Super Admin creating for a tenant
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
  currencyCode: CurrencyCode;
  depositPercentage: number; // 0-100
  cancellationHours: number;
  minBookingNoticeHours: number;
  maxBookingAdvanceDays: number;
  bufferMinutes?: number; // Default: 0
  sessionDurationMinutes?: number[]; // Default: [60, 90]
  whatsappPhone?: string;
}

// Update facility input
export interface UpdateFacilityInput {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currencyCode?: CurrencyCode;
  depositPercentage?: number;
  cancellationHours?: number;
  minBookingNoticeHours?: number;
  maxBookingAdvanceDays?: number;
  bufferMinutes?: number;
  sessionDurationMinutes?: number[];
  whatsappPhone?: string;
  status?: FacilityStatus;
}

// Facility credential types
export type CredentialType = 'whatsapp' | 'mercadopago' | 'gemini' | 'whisper';

// Update credentials input
export interface UpdateCredentialsInput {
  type: CredentialType;
  credentials: Record<string, string>;
}

// Credential test result
export interface CredentialTestResult {
  type: CredentialType;
  success: boolean;
  message: string;
  testedAt: string;
}

// Create court input
export interface CreateCourtInput {
  facilityId: string;
  name: string;
  sportType: SportType;
  description?: string;
  surfaceType?: string;
  isIndoor?: boolean;
  basePricePerHour: number;
  displayOrder?: number;
}

// Update court input
export interface UpdateCourtInput {
  name?: string;
  sportType?: SportType;
  description?: string;
  surfaceType?: string;
  isIndoor?: boolean;
  basePricePerHour?: number;
  displayOrder?: number;
  status?: CourtStatus;
}

// Facility filters
export interface FacilityFilters {
  status?: FacilityStatus;
  city?: string;
  search?: string;
}

// Court filters
export interface CourtFilters {
  facilityId?: string;
  status?: CourtStatus;
  sportType?: SportType;
  isIndoor?: boolean;
}

// QR Code data for facility
export interface FacilityQRCode {
  facilityId: string;
  whatsappUrl: string;
  qrCodeDataUrl: string; // Base64 encoded PNG
  generatedAt: string;
}

// Supported timezones (common for Argentina/LATAM)
export const SUPPORTED_TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba',
  'America/Argentina/Mendoza',
  'America/Montevideo',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Lima',
  'America/Bogota',
  'America/Mexico_City',
] as const;

export type SupportedTimezone = typeof SUPPORTED_TIMEZONES[number];

// Default facility configuration values
export const FACILITY_DEFAULTS = {
  timezone: 'America/Argentina/Buenos_Aires',
  currencyCode: 'ARS' as CurrencyCode,
  depositPercentage: 50,
  cancellationHours: 24,
  minBookingNoticeHours: 2,
  maxBookingAdvanceDays: 30,
  bufferMinutes: 0,
  sessionDurationMinutes: [60, 90],
} as const;
