// Multi-Step Facility Form Component
// Form for creating and editing facilities with step-by-step wizard

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Facility, CreateFacilityRequest, UpdateFacilityRequest } from '@/lib/facilities-api';

// Common timezones for Latin America
const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (São Paulo)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Montevideo', label: 'Uruguay (Montevideo)' },
  { value: 'UTC', label: 'UTC' },
];

// Common currencies
const CURRENCIES = [
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'BRL', label: 'Real Brasileño (BRL)' },
  { value: 'CLP', label: 'Peso Chileno (CLP)' },
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'PEN', label: 'Sol Peruano (PEN)' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'UYU', label: 'Peso Uruguayo (UYU)' },
];

// WhatsApp configuration types
type WhatsAppConfigType = 'individual' | 'shared' | 'none';

interface FacilityFormMultistepProps {
  facility?: Facility;
  tenantId?: string;
  onSubmit: (data: CreateFacilityRequest | UpdateFacilityRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Step definitions
const STEPS = [
  { id: 1, title: 'Información Básica', description: 'Nombre y contacto' },
  { id: 2, title: 'Ubicación', description: 'Dirección y ciudad' },
  { id: 3, title: 'Configuración Regional', description: 'Moneda y zona horaria' },
  { id: 4, title: 'WhatsApp', description: 'Configuración del bot' },
  { id: 5, title: 'Reservas', description: 'Seña y políticas' },
];

export function FacilityFormMultistep({
  facility,
  tenantId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FacilityFormMultistepProps) {
  const isEditing = !!facility;
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState(facility?.name || '');
  const [phone, setPhone] = useState(facility?.phone || '');
  const [email, setEmail] = useState(facility?.email || '');

  // Step 2: Location
  const [address, setAddress] = useState(facility?.address || '');
  const [city, setCity] = useState(facility?.city || '');
  const [country, setCountry] = useState(facility?.country || 'Argentina');

  // Step 3: Regional
  const [timezone, setTimezone] = useState(facility?.timezone || 'America/Argentina/Buenos_Aires');
  const [currencyCode, setCurrencyCode] = useState(facility?.currencyCode || 'ARS');

  // Step 4: WhatsApp
  const [whatsappConfigType, setWhatsappConfigType] = useState<WhatsAppConfigType>(
    facility?.whatsappPhone ? 'individual' : 'none'
  );
  const [whatsappPhone, setWhatsappPhone] = useState(facility?.whatsappPhone || '');

  // Step 5: Booking Settings
  const [depositPercentage, setDepositPercentage] = useState(facility?.depositPercentage ?? 50);
  const [cancellationHours, setCancellationHours] = useState(facility?.cancellationHours ?? 24);
  const [minBookingNoticeHours, setMinBookingNoticeHours] = useState(facility?.minBookingNoticeHours ?? 2);
  const [maxBookingAdvanceDays, setMaxBookingAdvanceDays] = useState(facility?.maxBookingAdvanceDays ?? 30);
  const [bufferMinutes, setBufferMinutes] = useState(facility?.bufferMinutes ?? 0);
  const [sessionDurations, setSessionDurations] = useState<number[]>(facility?.sessionDurationMinutes || [60, 90]);

  // Validation for each step
  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1:
        if (!name.trim()) {
          setError('El nombre de la instalación es requerido');
          return false;
        }
        if (!phone.trim()) {
          setError('El teléfono es requerido');
          return false;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('El email es requerido y debe ser válido');
          return false;
        }
        return true;

      case 2:
        if (!address.trim()) {
          setError('La dirección es requerida');
          return false;
        }
        if (!city.trim()) {
          setError('La ciudad es requerida');
          return false;
        }
        if (!country.trim()) {
          setError('El país es requerido');
          return false;
        }
        return true;

      case 3:
        // Timezone and currency have default values, always valid
        return true;

      case 4:
        if (whatsappConfigType === 'individual' && !whatsappPhone.trim()) {
          setError('El número de WhatsApp es requerido para la opción individual');
          return false;
        }
        return true;

      case 5:
        if (depositPercentage < 0 || depositPercentage > 100) {
          setError('El porcentaje de seña debe estar entre 0 y 100');
          return false;
        }
        if (cancellationHours < 0) {
          setError('Las horas de cancelación deben ser 0 o más');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    if (!isEditing && !tenantId) {
      setError('El tenant ID es requerido');
      return;
    }

    try {
      const baseData = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        phone: phone.trim(),
        email: email.trim(),
        timezone,
        currencyCode,
        depositPercentage,
        cancellationHours,
        minBookingNoticeHours,
        maxBookingAdvanceDays,
        bufferMinutes,
        sessionDurationMinutes: sessionDurations,
        whatsappPhone: whatsappConfigType === 'individual' ? whatsappPhone.trim() : undefined,
      };

      if (isEditing) {
        await onSubmit(baseData as UpdateFacilityRequest);
      } else {
        await onSubmit({
          ...baseData,
          tenantId: tenantId!,
        } as CreateFacilityRequest);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  // Toggle session duration
  const toggleSessionDuration = (duration: number) => {
    setSessionDurations((prev) => {
      if (prev.includes(duration)) {
        // Don't remove if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== duration);
      }
      return [...prev, duration].sort((a, b) => a - b);
    });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Instalación *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Cancha Los Amigos"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono de Contacto *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@ejemplo.com"
                disabled={isSubmitting}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Corrientes 1234"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Buenos Aires"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Argentina"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Usado para mensajes matutinos y horarios del calendario
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Moneda para precios y pagos
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Configuración de WhatsApp</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={whatsappConfigType === 'individual' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setWhatsappConfigType('individual')}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">📱</span>
                  Número Individual (Propio)
                </Button>
                <p className="text-xs text-muted-foreground ml-8">
                  La instalación usa su propio número de WhatsApp con Meta API
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={whatsappConfigType === 'shared' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setWhatsappConfigType('shared')}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">🔗</span>
                  Número Compartido (Plataforma)
                </Button>
                <p className="text-xs text-muted-foreground ml-8">
                  Usa el WhatsApp de la plataforma con enrutamiento por tenant
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={whatsappConfigType === 'none' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setWhatsappConfigType('none')}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">⏸️</span>
                  Configurar Después
                </Button>
                <p className="text-xs text-muted-foreground ml-8">
                  Puedes configurar WhatsApp más tarde desde el panel
                </p>
              </div>
            </div>

            {whatsappConfigType === 'individual' && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="whatsappPhone">Número de WhatsApp *</Label>
                <Input
                  id="whatsappPhone"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+54 11 9876-5432"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Número registrado en WhatsApp Business API. Las credenciales de Meta API se configuran en la sección de credenciales.
                </p>
              </div>
            )}

            {whatsappConfigType === 'shared' && (
              <div className="p-4 bg-muted rounded-md mt-4">
                <p className="text-sm">
                  El número compartido de la plataforma será asignado automáticamente.
                  Los clientes serán enrutados a esta instalación según el contexto de la conversación.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Deposit */}
            <div className="space-y-2">
              <Label htmlFor="depositPercentage">Porcentaje de Seña</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="depositPercentage"
                  type="number"
                  min={0}
                  max={100}
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <div className="flex-1 flex gap-2">
                  {[0, 25, 50, 75, 100].map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant={depositPercentage === val ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDepositPercentage(val)}
                      disabled={isSubmitting}
                    >
                      {val}%
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Porcentaje del total que el cliente debe pagar al reservar
              </p>
            </div>

            {/* Cancellation Hours */}
            <div className="space-y-2">
              <Label htmlFor="cancellationHours">Horas para Cancelación con Crédito</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="cancellationHours"
                  type="number"
                  min={0}
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">horas antes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Si cancela con más de estas horas de anticipación, la seña se convierte en crédito
              </p>
            </div>

            {/* Session Durations */}
            <div className="space-y-2">
              <Label>Duraciones de Turno Permitidas</Label>
              <div className="flex gap-2">
                {[60, 90, 120].map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant={sessionDurations.includes(duration) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSessionDuration(duration)}
                    disabled={isSubmitting}
                  >
                    {duration} min
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Duración de los turnos que los clientes pueden reservar
              </p>
            </div>

            {/* Buffer Minutes */}
            <div className="space-y-2">
              <Label htmlFor="bufferMinutes">Buffer Entre Turnos</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="bufferMinutes"
                  type="number"
                  min={0}
                  max={60}
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
                <div className="flex gap-2">
                  {[0, 10, 15, 30].map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant={bufferMinutes === val ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBufferMinutes(val)}
                      disabled={isSubmitting}
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo libre entre turnos para limpieza o preparación (0 = sin buffer)
              </p>
            </div>

            {/* Booking Notice and Advance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBookingNoticeHours">Aviso Mínimo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="minBookingNoticeHours"
                    type="number"
                    min={0}
                    value={minBookingNoticeHours}
                    onChange={(e) => setMinBookingNoticeHours(parseInt(e.target.value) || 0)}
                    disabled={isSubmitting}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">horas antes</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBookingAdvanceDays">Máximo Anticipación</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxBookingAdvanceDays"
                    type="number"
                    min={1}
                    value={maxBookingAdvanceDays}
                    onChange={(e) => setMaxBookingAdvanceDays(parseInt(e.target.value) || 1)}
                    disabled={isSubmitting}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">días</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-2xl mx-4 my-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Instalación' : 'Nueva Instalación'}
          </CardTitle>
          {/* Step Indicator */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 h-0.5 mx-1 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Current Step Title */}
          <div className="mt-4">
            <p className="font-medium">{STEPS[currentStep - 1].title}</p>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
          </div>
        </CardHeader>

        <CardContent className="max-h-[50vh] overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
              {error}
            </div>
          )}

          {renderStepContent()}
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Guardando...
                  </>
                ) : isEditing ? (
                  'Guardar'
                ) : (
                  'Crear Instalación'
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
