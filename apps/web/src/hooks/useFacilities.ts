// Facilities Hooks
// Custom hooks for facility management

'use client';

import { useCallback, useEffect } from 'react';
import { useFacilitiesStore } from '@/stores/facilities.store';
import type {
  QueryFacilityParams,
  CreateFacilityRequest,
  UpdateFacilityRequest,
  WhatsAppCredentials,
  MercadoPagoCredentials,
  GeminiCredentials,
  WhisperCredentials,
  CredentialType,
  GenerateQrCodeRequest,
} from '@/lib/facilities-api';

/**
 * Main hook for facility management
 * Provides all facility-related state and actions
 */
export function useFacilities() {
  const {
    facilities,
    selectedFacility,
    pagination,
    qrCode,
    loading,
    loadingFacility,
    creating,
    updating,
    deleting,
    updatingCredentials,
    testingCredentials,
    generatingQrCode,
    error,
    loadFacilities,
    loadFacility,
    create,
    update,
    remove,
    updateWhatsAppCredentials,
    updateMercadoPagoCredentials,
    updateGeminiCredentials,
    updateWhisperCredentials,
    testCredentials,
    generateQrCode,
    clearQrCode,
    setSelectedFacility,
    clearError,
  } = useFacilitiesStore();

  // Memoized callbacks for stable references
  const handleLoadFacilities = useCallback(
    (params?: QueryFacilityParams) => loadFacilities(params),
    [loadFacilities],
  );

  const handleLoadFacility = useCallback(
    (id: string) => loadFacility(id),
    [loadFacility],
  );

  const handleCreate = useCallback(
    (data: CreateFacilityRequest) => create(data),
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateFacilityRequest) => update(id, data),
    [update],
  );

  const handleRemove = useCallback(
    (id: string) => remove(id),
    [remove],
  );

  const handleUpdateWhatsAppCredentials = useCallback(
    (id: string, credentials: WhatsAppCredentials) => updateWhatsAppCredentials(id, credentials),
    [updateWhatsAppCredentials],
  );

  const handleUpdateMercadoPagoCredentials = useCallback(
    (id: string, credentials: MercadoPagoCredentials) => updateMercadoPagoCredentials(id, credentials),
    [updateMercadoPagoCredentials],
  );

  const handleUpdateGeminiCredentials = useCallback(
    (id: string, credentials: GeminiCredentials) => updateGeminiCredentials(id, credentials),
    [updateGeminiCredentials],
  );

  const handleUpdateWhisperCredentials = useCallback(
    (id: string, credentials: WhisperCredentials) => updateWhisperCredentials(id, credentials),
    [updateWhisperCredentials],
  );

  const handleTestCredentials = useCallback(
    (id: string, type: CredentialType) => testCredentials(id, type),
    [testCredentials],
  );

  const handleGenerateQrCode = useCallback(
    (id: string, options?: GenerateQrCodeRequest) => generateQrCode(id, options),
    [generateQrCode],
  );

  const handleClearQrCode = useCallback(() => clearQrCode(), [clearQrCode]);

  const handleSetSelectedFacility = useCallback(
    (facility: typeof selectedFacility) => setSelectedFacility(facility),
    [setSelectedFacility],
  );

  const handleClearError = useCallback(() => clearError(), [clearError]);

  return {
    // State
    facilities,
    selectedFacility,
    pagination,
    qrCode,
    loading,
    loadingFacility,
    creating,
    updating,
    deleting,
    updatingCredentials,
    testingCredentials,
    generatingQrCode,
    error,

    // Actions
    loadFacilities: handleLoadFacilities,
    loadFacility: handleLoadFacility,
    create: handleCreate,
    update: handleUpdate,
    remove: handleRemove,
    updateWhatsAppCredentials: handleUpdateWhatsAppCredentials,
    updateMercadoPagoCredentials: handleUpdateMercadoPagoCredentials,
    updateGeminiCredentials: handleUpdateGeminiCredentials,
    updateWhisperCredentials: handleUpdateWhisperCredentials,
    testCredentials: handleTestCredentials,
    generateQrCode: handleGenerateQrCode,
    clearQrCode: handleClearQrCode,
    setSelectedFacility: handleSetSelectedFacility,
    clearError: handleClearError,
  };
}

/**
 * Hook to auto-load facilities on mount
 */
export function useFacilitiesLoader(params?: QueryFacilityParams) {
  const { loadFacilities, facilities, loading, error, pagination } = useFacilities();

  useEffect(() => {
    loadFacilities(params);
  }, [loadFacilities, params?.page, params?.limit, params?.status, params?.tenantId, params?.search]);

  return { facilities, loading, error, pagination };
}

/**
 * Hook to load a single facility by ID
 */
export function useFacilityById(id: string | undefined) {
  const { loadFacility, selectedFacility, loadingFacility, error } = useFacilities();

  useEffect(() => {
    if (id) {
      loadFacility(id);
    }
  }, [id, loadFacility]);

  return { facility: selectedFacility, loading: loadingFacility, error };
}

/**
 * Hook for facility owners/staff to load their own facility
 * Automatically loads the first facility for the user's tenant
 */
export function useUserFacility() {
  const {
    facilities,
    selectedFacility,
    loading,
    error,
    loadFacilities,
    setSelectedFacility,
  } = useFacilities();

  // Load user's facilities
  const loadUserFacility = useCallback(async () => {
    await loadFacilities({ limit: 1 });
  }, [loadFacilities]);

  // Auto-select first facility when loaded
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0]);
    }
  }, [facilities, selectedFacility, setSelectedFacility]);

  return {
    facility: selectedFacility,
    selectedFacility,
    loading,
    error,
    loadUserFacility,
  };
}
