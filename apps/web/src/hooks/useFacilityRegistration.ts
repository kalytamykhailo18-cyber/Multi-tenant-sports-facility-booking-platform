// Facility Registration Hook
// Custom hook for facility registration state management

'use client';

import { useCallback } from 'react';
import { useFacilityRegistrationStore } from '@/stores/facility-registration.store';
import type { RegisterFacilityRequest } from '@/lib/facilities-api';

export function useFacilityRegistration() {
  const {
    currentStep,
    formData,
    isSubmitting,
    error,
    registrationResult,
    setStep,
    nextStep,
    previousStep,
    updateFormData,
    submitRegistration,
    reset,
    clearError,
  } = useFacilityRegistrationStore();

  // Memoized callbacks
  const handleSetStep = useCallback((step: number) => setStep(step), [setStep]);
  const handleNextStep = useCallback(() => nextStep(), [nextStep]);
  const handlePreviousStep = useCallback(() => previousStep(), [previousStep]);
  const handleUpdateFormData = useCallback(
    (data: Partial<RegisterFacilityRequest>) => updateFormData(data),
    [updateFormData],
  );
  const handleSubmit = useCallback(() => submitRegistration(), [submitRegistration]);
  const handleReset = useCallback(() => reset(), [reset]);
  const handleClearError = useCallback(() => clearError(), [clearError]);

  // Computed values
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 8;
  const isComplete = !!registrationResult;
  const progressPercentage = (currentStep / 8) * 100;

  return {
    // State
    currentStep,
    formData,
    isSubmitting,
    error,
    registrationResult,

    // Computed
    isFirstStep,
    isLastStep,
    isComplete,
    progressPercentage,

    // Actions
    setStep: handleSetStep,
    nextStep: handleNextStep,
    previousStep: handlePreviousStep,
    updateFormData: handleUpdateFormData,
    submit: handleSubmit,
    reset: handleReset,
    clearError: handleClearError,
  };
}
