// Facilities Store
// Zustand store for facility state management

import { create } from 'zustand';
import {
  facilitiesApi,
  type Facility,
  type QueryFacilityParams,
  type CreateFacilityRequest,
  type UpdateFacilityRequest,
  type WhatsAppCredentials,
  type MercadoPagoCredentials,
  type GeminiCredentials,
  type WhisperCredentials,
  type CredentialType,
  type TestCredentialsResult,
  type QrCodeResponse,
  type GenerateQrCodeRequest,
} from '@/lib/facilities-api';

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FacilitiesState {
  // Data
  facilities: Facility[];
  selectedFacility: Facility | null;
  pagination: PaginationState;
  qrCode: QrCodeResponse | null;

  // Loading states
  loading: boolean;
  loadingFacility: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  updatingCredentials: boolean;
  testingCredentials: boolean;
  generatingQrCode: boolean;

  // Error state
  error: string | null;

  // Actions
  loadFacilities: (params?: QueryFacilityParams) => Promise<void>;
  loadFacility: (id: string) => Promise<void>;
  create: (data: CreateFacilityRequest) => Promise<Facility>;
  update: (id: string, data: UpdateFacilityRequest) => Promise<Facility>;
  remove: (id: string) => Promise<void>;
  updateWhatsAppCredentials: (id: string, credentials: WhatsAppCredentials) => Promise<void>;
  updateMercadoPagoCredentials: (id: string, credentials: MercadoPagoCredentials) => Promise<void>;
  updateGeminiCredentials: (id: string, credentials: GeminiCredentials) => Promise<void>;
  updateWhisperCredentials: (id: string, credentials: WhisperCredentials) => Promise<void>;
  testCredentials: (id: string, type: CredentialType) => Promise<TestCredentialsResult>;
  generateQrCode: (id: string, options?: GenerateQrCodeRequest) => Promise<QrCodeResponse>;
  clearQrCode: () => void;
  setSelectedFacility: (facility: Facility | null) => void;
  clearError: () => void;
}

export const useFacilitiesStore = create<FacilitiesState>((set, get) => ({
  // Initial state
  facilities: [],
  selectedFacility: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  qrCode: null,
  loading: false,
  loadingFacility: false,
  creating: false,
  updating: false,
  deleting: false,
  updatingCredentials: false,
  testingCredentials: false,
  generatingQrCode: false,
  error: null,

  // Actions
  loadFacilities: async (params?: QueryFacilityParams) => {
    set({ loading: true, error: null });
    try {
      const response = await facilitiesApi.list(params);
      set({
        facilities: response.items,
        pagination: {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar instalaciones',
        loading: false,
      });
    }
  },

  loadFacility: async (id: string) => {
    set({ loadingFacility: true, error: null });
    try {
      const facility = await facilitiesApi.getById(id);
      set({ selectedFacility: facility, loadingFacility: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar instalación',
        loadingFacility: false,
      });
    }
  },

  create: async (data: CreateFacilityRequest) => {
    set({ creating: true, error: null });
    try {
      const facility = await facilitiesApi.create(data);
      set((state) => ({
        facilities: [facility, ...state.facilities],
        creating: false,
      }));
      return facility;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al crear instalación',
        creating: false,
      });
      throw error;
    }
  },

  update: async (id: string, data: UpdateFacilityRequest) => {
    set({ updating: true, error: null });
    try {
      const facility = await facilitiesApi.update(id, data);
      set((state) => ({
        facilities: state.facilities.map((f) => (f.id === id ? facility : f)),
        selectedFacility: state.selectedFacility?.id === id ? facility : state.selectedFacility,
        updating: false,
      }));
      return facility;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar instalación',
        updating: false,
      });
      throw error;
    }
  },

  remove: async (id: string) => {
    set({ deleting: true, error: null });
    try {
      await facilitiesApi.delete(id);
      set((state) => ({
        facilities: state.facilities.filter((f) => f.id !== id),
        selectedFacility: state.selectedFacility?.id === id ? null : state.selectedFacility,
        deleting: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar instalación',
        deleting: false,
      });
      throw error;
    }
  },

  updateWhatsAppCredentials: async (id: string, credentials: WhatsAppCredentials) => {
    set({ updatingCredentials: true, error: null });
    try {
      await facilitiesApi.updateWhatsAppCredentials(id, credentials);
      // Reload facility to get updated credentials status
      const facility = await facilitiesApi.getById(id);
      set((state) => ({
        facilities: state.facilities.map((f) => (f.id === id ? facility : f)),
        selectedFacility: state.selectedFacility?.id === id ? facility : state.selectedFacility,
        updatingCredentials: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar credenciales WhatsApp',
        updatingCredentials: false,
      });
      throw error;
    }
  },

  updateMercadoPagoCredentials: async (id: string, credentials: MercadoPagoCredentials) => {
    set({ updatingCredentials: true, error: null });
    try {
      await facilitiesApi.updateMercadoPagoCredentials(id, credentials);
      const facility = await facilitiesApi.getById(id);
      set((state) => ({
        facilities: state.facilities.map((f) => (f.id === id ? facility : f)),
        selectedFacility: state.selectedFacility?.id === id ? facility : state.selectedFacility,
        updatingCredentials: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar credenciales Mercado Pago',
        updatingCredentials: false,
      });
      throw error;
    }
  },

  updateGeminiCredentials: async (id: string, credentials: GeminiCredentials) => {
    set({ updatingCredentials: true, error: null });
    try {
      await facilitiesApi.updateGeminiCredentials(id, credentials);
      const facility = await facilitiesApi.getById(id);
      set((state) => ({
        facilities: state.facilities.map((f) => (f.id === id ? facility : f)),
        selectedFacility: state.selectedFacility?.id === id ? facility : state.selectedFacility,
        updatingCredentials: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar credenciales Gemini',
        updatingCredentials: false,
      });
      throw error;
    }
  },

  updateWhisperCredentials: async (id: string, credentials: WhisperCredentials) => {
    set({ updatingCredentials: true, error: null });
    try {
      await facilitiesApi.updateWhisperCredentials(id, credentials);
      const facility = await facilitiesApi.getById(id);
      set((state) => ({
        facilities: state.facilities.map((f) => (f.id === id ? facility : f)),
        selectedFacility: state.selectedFacility?.id === id ? facility : state.selectedFacility,
        updatingCredentials: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar credenciales Whisper',
        updatingCredentials: false,
      });
      throw error;
    }
  },

  testCredentials: async (id: string, type: CredentialType) => {
    set({ testingCredentials: true, error: null });
    try {
      const result = await facilitiesApi.testCredentials(id, type);
      set({ testingCredentials: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al probar credenciales',
        testingCredentials: false,
      });
      throw error;
    }
  },

  generateQrCode: async (id: string, options?: GenerateQrCodeRequest) => {
    set({ generatingQrCode: true, error: null });
    try {
      const qrCode = await facilitiesApi.generateQrCode(id, options);
      set({ qrCode, generatingQrCode: false });
      return qrCode;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al generar código QR',
        generatingQrCode: false,
      });
      throw error;
    }
  },

  clearQrCode: () => {
    set({ qrCode: null });
  },

  setSelectedFacility: (facility: Facility | null) => {
    set({ selectedFacility: facility });
  },

  clearError: () => {
    set({ error: null });
  },
}));
