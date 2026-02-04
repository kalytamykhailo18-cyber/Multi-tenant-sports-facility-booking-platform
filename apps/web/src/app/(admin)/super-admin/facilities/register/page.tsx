// Facility Registration Page
// 8-step registration form for Super Admin

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useFacilityRegistration } from '@/hooks/useFacilityRegistration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function FacilityRegistrationPage() {
  const router = useRouter();
  const {
    currentStep,
    formData,
    isSubmitting,
    error,
    registrationResult,
    isFirstStep,
    isLastStep,
    isComplete,
    progressPercentage,
    nextStep,
    previousStep,
    updateFormData,
    submit,
    clearError,
  } = useFacilityRegistration();

  // Step validation
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.facilityName) errors.facilityName = 'Facility name is required';
        if (!formData.businessName) errors.businessName = 'Business name is required';
        if (!formData.address) errors.address = 'Address is required';
        if (!formData.city) errors.city = 'City is required';
        if (!formData.country) errors.country = 'Country is required';
        if (!formData.facilityPhone) errors.facilityPhone = 'Phone is required';
        if (!formData.facilityEmail) errors.facilityEmail = 'Email is required';
        break;

      case 2: // Owner Account
        if (!formData.ownerName) errors.ownerName = 'Owner name is required';
        if (!formData.ownerEmail) errors.ownerEmail = 'Owner email is required';
        if (!formData.ownerPhone) errors.ownerPhone = 'Owner phone is required';
        if (!formData.ownerPassword) errors.ownerPassword = 'Password is required';
        else if (formData.ownerPassword.length < 8)
          errors.ownerPassword = 'Password must be at least 8 characters';
        break;

      case 8: // Subscription
        if (!formData.monthlyPrice) errors.monthlyPrice = 'Monthly price is required';
        else if (formData.monthlyPrice <= 0) errors.monthlyPrice = 'Price must be greater than 0';
        break;
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    previousStep();
  };

  const handleSubmit = async () => {
    if (validateStep()) {
      await submit();
    }
  };

  // Show success message after registration
  if (isComplete && registrationResult) {
    return (
      <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
        <div className="container mx-auto py-6 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Registration Successful!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Facility has been registered successfully.</p>
                <div className="grid gap-2">
                  <p>
                    <strong>Facility:</strong> {registrationResult.facilityName}
                  </p>
                  <p>
                    <strong>Owner Email:</strong> {registrationResult.ownerEmail}
                  </p>
                  <p>
                    <strong>Facility ID:</strong> {registrationResult.facilityId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/super-admin/facilities')}>
                    View All Facilities
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/super-admin')}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Register New Facility</h1>
          <p className="text-muted-foreground mt-2">
            Step {currentStep} of 8 - {getStepTitle(currentStep)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-700 hover:text-red-900">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle(currentStep)}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep(currentStep, formData, updateFormData, stepErrors)}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button variant="outline" onClick={handlePrevious} disabled={isFirstStep || isSubmitting}>
                Previous
              </Button>
              {!isLastStep ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner /> Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

function getStepTitle(step: number): string {
  const titles = [
    'Basic Information',
    'Owner Account',
    'Configuration',
    'Pricing',
    'WhatsApp Connection',
    'Mercado Pago',
    'Business Info for AI',
    'Subscription Setup',
  ];
  return titles[step - 1] || '';
}

function renderStep(
  step: number,
  formData: any,
  updateFormData: (data: any) => void,
  errors: Record<string, string>,
) {
  switch (step) {
    case 1:
      return <Step1BasicInfo formData={formData} updateFormData={updateFormData} errors={errors} />;
    case 2:
      return <Step2OwnerAccount formData={formData} updateFormData={updateFormData} errors={errors} />;
    case 3:
      return <Step3Configuration formData={formData} updateFormData={updateFormData} />;
    case 4:
      return <Step4Pricing formData={formData} updateFormData={updateFormData} errors={errors} />;
    case 5:
      return <Step5WhatsApp formData={formData} updateFormData={updateFormData} />;
    case 6:
      return <Step6MercadoPago />;
    case 7:
      return <Step7BusinessInfo formData={formData} updateFormData={updateFormData} />;
    case 8:
      return <Step8Subscription formData={formData} updateFormData={updateFormData} errors={errors} />;
    default:
      return null;
  }
}

// Step 1: Basic Information
function Step1BasicInfo({ formData, updateFormData, errors }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="facilityName">Facility Name *</Label>
        <Input
          id="facilityName"
          value={formData.facilityName || ''}
          onChange={(e) => updateFormData({ facilityName: e.target.value })}
          placeholder="e.g., Cancha Los Amigos"
        />
        {errors.facilityName && <p className="text-red-500 text-sm mt-1">{errors.facilityName}</p>}
      </div>

      <div>
        <Label htmlFor="businessName">Business Name (Legal) *</Label>
        <Input
          id="businessName"
          value={formData.businessName || ''}
          onChange={(e) => updateFormData({ businessName: e.target.value })}
          placeholder="e.g., Los Amigos S.A."
        />
        {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address || ''}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="e.g., Av. Corrientes 1234"
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city || ''}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder="e.g., Monte Grande"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={formData.country || ''}
            onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="e.g., Argentina"
          />
          {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="facilityPhone">Phone *</Label>
          <Input
            id="facilityPhone"
            value={formData.facilityPhone || ''}
            onChange={(e) => updateFormData({ facilityPhone: e.target.value })}
            placeholder="+54 11 1234-5678"
          />
          {errors.facilityPhone && <p className="text-red-500 text-sm mt-1">{errors.facilityPhone}</p>}
        </div>

        <div>
          <Label htmlFor="facilityEmail">Email *</Label>
          <Input
            id="facilityEmail"
            type="email"
            value={formData.facilityEmail || ''}
            onChange={(e) => updateFormData({ facilityEmail: e.target.value })}
            placeholder="contacto@example.com"
          />
          {errors.facilityEmail && <p className="text-red-500 text-sm mt-1">{errors.facilityEmail}</p>}
        </div>
      </div>
    </div>
  );
}

// Step 2: Owner Account
function Step2OwnerAccount({ formData, updateFormData, errors }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This account will be used by the facility owner to log in to the dashboard.
      </p>

      <div>
        <Label htmlFor="ownerName">Owner Full Name *</Label>
        <Input
          id="ownerName"
          value={formData.ownerName || ''}
          onChange={(e) => updateFormData({ ownerName: e.target.value })}
          placeholder="e.g., Juan Pérez"
        />
        {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
      </div>

      <div>
        <Label htmlFor="ownerEmail">Owner Email (Login) *</Label>
        <Input
          id="ownerEmail"
          type="email"
          value={formData.ownerEmail || ''}
          onChange={(e) => updateFormData({ ownerEmail: e.target.value })}
          placeholder="juan@example.com"
        />
        {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
      </div>

      <div>
        <Label htmlFor="ownerPhone">Owner Phone *</Label>
        <Input
          id="ownerPhone"
          value={formData.ownerPhone || ''}
          onChange={(e) => updateFormData({ ownerPhone: e.target.value })}
          placeholder="+54 11 9876-5432"
        />
        {errors.ownerPhone && <p className="text-red-500 text-sm mt-1">{errors.ownerPhone}</p>}
      </div>

      <div>
        <Label htmlFor="ownerPassword">Temporary Password *</Label>
        <Input
          id="ownerPassword"
          type="password"
          value={formData.ownerPassword || ''}
          onChange={(e) => updateFormData({ ownerPassword: e.target.value })}
          placeholder="Min. 8 characters"
        />
        {errors.ownerPassword && <p className="text-red-500 text-sm mt-1">{errors.ownerPassword}</p>}
        <p className="text-sm text-muted-foreground mt-1">
          Owner can change this password after first login.
        </p>
      </div>
    </div>
  );
}

// Step 3: Configuration
function Step3Configuration({ formData, updateFormData }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={formData.timezone || 'America/Argentina/Buenos_Aires'}
            onChange={(e) => updateFormData({ timezone: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
            <option value="America/Argentina/Cordoba">Córdoba (GMT-3)</option>
            <option value="America/Montevideo">Montevideo (GMT-3)</option>
            <option value="America/Santiago">Santiago (GMT-3)</option>
            <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
          </select>
        </div>

        <div>
          <Label htmlFor="currencyCode">Currency</Label>
          <select
            id="currencyCode"
            value={formData.currencyCode || 'ARS'}
            onChange={(e) => updateFormData({ currencyCode: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ARS">ARS - Argentine Peso</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="depositPercentage">Deposit % (0-100)</Label>
          <Input
            id="depositPercentage"
            type="number"
            min="0"
            max="100"
            value={formData.depositPercentage || 50}
            onChange={(e) => updateFormData({ depositPercentage: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="cancellationHours">Cancellation Hours</Label>
          <Input
            id="cancellationHours"
            type="number"
            min="0"
            value={formData.cancellationHours || 24}
            onChange={(e) => updateFormData({ cancellationHours: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minBookingNoticeHours">Min. Booking Notice (hours)</Label>
          <Input
            id="minBookingNoticeHours"
            type="number"
            min="0"
            value={formData.minBookingNoticeHours || 2}
            onChange={(e) => updateFormData({ minBookingNoticeHours: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="maxBookingAdvanceDays">Max. Advance Booking (days)</Label>
          <Input
            id="maxBookingAdvanceDays"
            type="number"
            min="1"
            value={formData.maxBookingAdvanceDays || 30}
            onChange={(e) => updateFormData({ maxBookingAdvanceDays: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bufferMinutes">Buffer Between Sessions (minutes)</Label>
        <Input
          id="bufferMinutes"
          type="number"
          min="0"
          value={formData.bufferMinutes || 0}
          onChange={(e) => updateFormData({ bufferMinutes: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}

// Step 4: Pricing
function Step4Pricing({ formData, updateFormData, errors }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Basic pricing configuration. Detailed court-specific pricing can be set up later.
      </p>

      <div>
        <Label htmlFor="whatsappPhone">WhatsApp Phone (Optional)</Label>
        <Input
          id="whatsappPhone"
          value={formData.whatsappPhone || ''}
          onChange={(e) => updateFormData({ whatsappPhone: e.target.value })}
          placeholder="+54 11 9876-5432"
        />
        <p className="text-sm text-muted-foreground mt-1">
          This number will be used for the WhatsApp bot connection.
        </p>
      </div>
    </div>
  );
}

// Step 5: WhatsApp
function Step5WhatsApp({ formData }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        WhatsApp connection can be set up after registration is complete. The owner will scan a QR code to
        connect their WhatsApp Business account.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm">
          <strong>Note:</strong> WhatsApp connection will be available in the facility settings after
          registration.
        </p>
      </div>
    </div>
  );
}

// Step 6: Mercado Pago
function Step6MercadoPago() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mercado Pago OAuth connection can be set up after registration. The owner will authenticate their
        Mercado Pago account securely.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm">
          <strong>Note:</strong> Mercado Pago connection will be available in the facility settings after
          registration.
        </p>
      </div>
    </div>
  );
}

// Step 7: Business Info
function Step7BusinessInfo({ formData }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        AI customization (greeting, business info, FAQs) can be configured after registration in the facility
        settings.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm">
          <strong>Note:</strong> AI customization will be available in the facility settings after
          registration.
        </p>
      </div>
    </div>
  );
}

// Step 8: Subscription
function Step8Subscription({ formData, updateFormData, errors }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="monthlyPrice">Monthly Subscription Price *</Label>
        <Input
          id="monthlyPrice"
          type="number"
          min="0"
          value={formData.monthlyPrice || ''}
          onChange={(e) => updateFormData({ monthlyPrice: parseFloat(e.target.value) || 0 })}
          placeholder="e.g., 10000"
        />
        {errors.monthlyPrice && <p className="text-red-500 text-sm mt-1">{errors.monthlyPrice}</p>}
        <p className="text-sm text-muted-foreground mt-1">Amount in {formData.currencyCode || 'ARS'}</p>
      </div>

      <div>
        <Label htmlFor="firstDueDate">First Payment Due Date (Optional)</Label>
        <Input
          id="firstDueDate"
          type="date"
          value={formData.firstDueDate || ''}
          onChange={(e) => updateFormData({ firstDueDate: e.target.value })}
        />
        <p className="text-sm text-muted-foreground mt-1">Leave empty for 30 days from today</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
        <h3 className="font-semibold mb-2">Ready to Complete Registration</h3>
        <p className="text-sm">
          Click "Complete Registration" to create the facility, owner account, and subscription.
        </p>
      </div>
    </div>
  );
}
