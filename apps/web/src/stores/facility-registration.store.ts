// Facility Registration Store
// Manages multi-step facility registration state

import { create } from 'zustand';
import { facilitiesApi, type RegisterFacilityRequest, type RegisterFacilityResponse } from '@/lib/facilities-api';

interface FacilityRegistrationState {
  // Current step (1-8)
  currentStep: number;

  // Form data for each step
  formData: Partial<RegisterFacilityRequest>;

  // Loading and error states
  isSubmitting: boolean;
  error: string | null;

  // Result after successful registration
  registrationResult: RegisterFacilityResponse | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Partial<RegisterFacilityRequest>) => void;
  submitRegistration: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

const initialState = {
  currentStep: 1,
  formData: {
    timezone: 'America/Argentina/Buenos_Aires',
    currencyCode: 'ARS',
    depositPercentage: 50,
    cancellationHours: 24,
    minBookingNoticeHours: 2,
    maxBookingAdvanceDays: 30,
    bufferMinutes: 0,
    sessionDurationMinutes: [60, 90],
    status: 'ACTIVE' as const,
  },
  isSubmitting: false,
  error: null,
  registrationResult: null,
};

export const useFacilityRegistrationStore = create<FacilityRegistrationState>((set, get) => ({
  ...initialState,

  setStep: (step: number) => {
    if (step >= 1 && step <= 8) {
      set({ currentStep: step });
    }
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 8) {
      set({ currentStep: currentStep + 1 });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  updateFormData: (data: Partial<RegisterFacilityRequest>) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
  },

  submitRegistration: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const { formData } = get();

      // Validate required fields
      if (
        !formData.facilityName ||
        !formData.businessName ||
        !formData.address ||
        !formData.city ||
        !formData.country ||
        !formData.facilityPhone ||
        !formData.facilityEmail ||
        !formData.ownerName ||
        !formData.ownerEmail ||
        !formData.ownerPhone ||
        !formData.ownerPassword ||
        !formData.monthlyPrice
      ) {
        throw new Error('Please complete all required fields');
      }

      const result = await facilitiesApi.register(formData as RegisterFacilityRequest);

      set({
        registrationResult: result,
        isSubmitting: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed. Please try again.',
        isSubmitting: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
