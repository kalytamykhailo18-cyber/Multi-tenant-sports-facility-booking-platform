// Facility Form Component
// Form for creating and editing facilities

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Facility, CreateFacilityRequest, UpdateFacilityRequest } from '@/lib/facilities-api';

interface FacilityFormProps {
  facility?: Facility;
  tenantId?: string;
  onSubmit: (data: CreateFacilityRequest | UpdateFacilityRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FacilityForm({
  facility,
  tenantId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FacilityFormProps) {
  const isEditing = !!facility;

  // Form state
  const [name, setName] = useState(facility?.name || '');
  const [address, setAddress] = useState(facility?.address || '');
  const [city, setCity] = useState(facility?.city || '');
  const [country, setCountry] = useState(facility?.country || 'Argentina');
  const [phone, setPhone] = useState(facility?.phone || '');
  const [email, setEmail] = useState(facility?.email || '');
  const [timezone, setTimezone] = useState(facility?.timezone || 'America/Argentina/Buenos_Aires');
  const [currencyCode, setCurrencyCode] = useState(facility?.currencyCode || 'ARS');
  const [depositPercentage, setDepositPercentage] = useState(facility?.depositPercentage ?? 50);
  const [cancellationHours, setCancellationHours] = useState(facility?.cancellationHours ?? 24);
  const [minBookingNoticeHours, setMinBookingNoticeHours] = useState(facility?.minBookingNoticeHours ?? 2);
  const [maxBookingAdvanceDays, setMaxBookingAdvanceDays] = useState(facility?.maxBookingAdvanceDays ?? 30);
  const [bufferMinutes, setBufferMinutes] = useState(facility?.bufferMinutes ?? 0);
  const [whatsappPhone, setWhatsappPhone] = useState(facility?.whatsappPhone || '');
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('El nombre de la instalación es requerido');
      return;
    }

    if (!address.trim()) {
      setError('La dirección es requerida');
      return;
    }

    if (!city.trim()) {
      setError('La ciudad es requerida');
      return;
    }

    if (!phone.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('El email es requerido y debe ser válido');
      return;
    }

    if (!isEditing && !tenantId) {
      setError('El tenant ID es requerido');
      return;
    }

    setError(null);

    try {
      if (isEditing) {
        const updateData: UpdateFacilityRequest = {
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
          whatsappPhone: whatsappPhone.trim() || undefined,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateFacilityRequest = {
          tenantId: tenantId!,
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
          whatsappPhone: whatsappPhone.trim() || undefined,
        };
        await onSubmit(createData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-2xl mx-4 my-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Instalación' : 'Nueva Instalación'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Cancha Los Amigos"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Address */}
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

          {/* City and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@ejemplo.com"
              disabled={isSubmitting}
            />
          </div>

          {/* WhatsApp Phone */}
          <div className="space-y-2">
            <Label htmlFor="whatsappPhone">WhatsApp (opcional)</Label>
            <Input
              id="whatsappPhone"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="+54 11 9876-5432"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Número para el bot de WhatsApp
            </p>
          </div>

          {/* Booking Settings */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4">Configuración de Reservas</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depositPercentage">Seña (%)</Label>
                <Input
                  id="depositPercentage"
                  type="number"
                  min={0}
                  max={100}
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellationHours">Cancelación (hs)</Label>
                <Input
                  id="cancellationHours"
                  type="number"
                  min={0}
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minBookingNoticeHours">Aviso mín (hs)</Label>
                <Input
                  id="minBookingNoticeHours"
                  type="number"
                  min={0}
                  value={minBookingNoticeHours}
                  onChange={(e) => setMinBookingNoticeHours(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBookingAdvanceDays">Máx días</Label>
                <Input
                  id="maxBookingAdvanceDays"
                  type="number"
                  min={1}
                  value={maxBookingAdvanceDays}
                  onChange={(e) => setMaxBookingAdvanceDays(parseInt(e.target.value) || 1)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bufferMinutes">Buffer entre turnos (min)</Label>
                <Input
                  id="bufferMinutes"
                  type="number"
                  min={0}
                  max={60}
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Moneda</Label>
                <Input
                  id="currencyCode"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="ARS"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Guardar' : 'Crear'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
