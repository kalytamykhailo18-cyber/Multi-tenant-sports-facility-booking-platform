// Facilities API Functions
// API client functions for facility management

import { apiClient } from './api';

// Types
export interface CredentialsStatus {
  whatsapp: boolean;
  mercadoPago: boolean;
  gemini: boolean;
  whisper: boolean;
}

export interface Facility {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
  currencyCode: string;
  depositPercentage: number;
  cancellationHours: number;
  minBookingNoticeHours: number;
  maxBookingAdvanceDays: number;
  bufferMinutes: number;
  sessionDurationMinutes: number[];
  whatsappPhone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  courtCount?: number;
  credentials?: CredentialsStatus;
}

export interface FacilityListResponse {
  items: Facility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFacilityRequest {
  tenantId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  timezone?: string;
  currencyCode?: string;
  depositPercentage?: number;
  cancellationHours?: number;
  minBookingNoticeHours?: number;
  maxBookingAdvanceDays?: number;
  bufferMinutes?: number;
  sessionDurationMinutes?: number[];
  whatsappPhone?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface UpdateFacilityRequest {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currencyCode?: string;
  depositPercentage?: number;
  cancellationHours?: number;
  minBookingNoticeHours?: number;
  maxBookingAdvanceDays?: number;
  bufferMinutes?: number;
  sessionDurationMinutes?: number[];
  whatsappPhone?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface QueryFacilityParams {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  tenantId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'city' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface WhatsAppCredentials {
  apiKey: string;
  apiSecret: string;
  webhookToken?: string;
}

export interface MercadoPagoCredentials {
  accessToken: string;
  publicKey: string;
}

export interface GeminiCredentials {
  apiKey: string;
}

export interface WhisperCredentials {
  apiKey: string;
}

export interface TestCredentialsResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export type CredentialType = 'whatsapp' | 'mercadopago' | 'gemini' | 'whisper';

export interface QrCodeResponse {
  qrCode: string;
  whatsappLink: string;
  facilityName: string;
  whatsappPhone?: string;
}

export interface GenerateQrCodeRequest {
  message?: string;
  size?: number;
}

// API functions
export const facilitiesApi = {
  /**
   * Get paginated list of facilities
   */
  async list(params?: QueryFacilityParams): Promise<FacilityListResponse> {
    return apiClient.get<FacilityListResponse>('/facilities', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Get facility by ID
   */
  async getById(id: string): Promise<Facility> {
    return apiClient.get<Facility>(`/facilities/${id}`);
  },

  /**
   * Create a new facility
   */
  async create(data: CreateFacilityRequest): Promise<Facility> {
    return apiClient.post<Facility>('/facilities', data);
  },

  /**
   * Update a facility
   */
  async update(id: string, data: UpdateFacilityRequest): Promise<Facility> {
    return apiClient.patch<Facility>(`/facilities/${id}`, data);
  },

  /**
   * Delete a facility
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/facilities/${id}`);
  },

  /**
   * Update WhatsApp credentials
   */
  async updateWhatsAppCredentials(
    id: string,
    credentials: WhatsAppCredentials,
  ): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `/facilities/${id}/credentials/whatsapp`,
      credentials,
    );
  },

  /**
   * Update Mercado Pago credentials
   */
  async updateMercadoPagoCredentials(
    id: string,
    credentials: MercadoPagoCredentials,
  ): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `/facilities/${id}/credentials/mercadopago`,
      credentials,
    );
  },

  /**
   * Update Gemini AI credentials
   */
  async updateGeminiCredentials(
    id: string,
    credentials: GeminiCredentials,
  ): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `/facilities/${id}/credentials/gemini`,
      credentials,
    );
  },

  /**
   * Update Whisper credentials
   */
  async updateWhisperCredentials(
    id: string,
    credentials: WhisperCredentials,
  ): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `/facilities/${id}/credentials/whisper`,
      credentials,
    );
  },

  /**
   * Test credentials
   */
  async testCredentials(id: string, type: CredentialType): Promise<TestCredentialsResult> {
    return apiClient.post<TestCredentialsResult>(`/facilities/${id}/credentials/${type}/test`);
  },

  /**
   * Generate QR code for facility's WhatsApp
   */
  async generateQrCode(id: string, options?: GenerateQrCodeRequest): Promise<QrCodeResponse> {
    return apiClient.post<QrCodeResponse>(`/facilities/${id}/qr-code`, options || {});
  },
};
