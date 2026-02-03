// Court Form Component
// Form for creating and editing courts

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Court, CreateCourtRequest, UpdateCourtRequest, SportType, CourtStatus } from '@/lib/courts-api';

interface CourtFormProps {
  court?: Court;
  facilityId: string;
  currencyCode?: string;
  onSubmit: (data: CreateCourtRequest | UpdateCourtRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SPORT_TYPES: { value: SportType; label: string }[] = [
  { value: 'SOCCER', label: 'Fútbol' },
  { value: 'PADEL', label: 'Pádel' },
  { value: 'TENNIS', label: 'Tenis' },
  { value: 'MULTI', label: 'Multiuso' },
];

const COURT_STATUSES: { value: CourtStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'INACTIVE', label: 'Inactiva' },
];

export function CourtForm({
  court,
  facilityId,
  currencyCode = 'ARS',
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CourtFormProps) {
  const isEditing = !!court;

  // Form state
  const [name, setName] = useState(court?.name || '');
  const [sportType, setSportType] = useState<SportType>(court?.sportType || 'SOCCER');
  const [description, setDescription] = useState(court?.description || '');
  const [surfaceType, setSurfaceType] = useState(court?.surfaceType || '');
  const [isIndoor, setIsIndoor] = useState(court?.isIndoor || false);
  const [basePricePerHour, setBasePricePerHour] = useState(court?.basePricePerHour ?? 0);
  const [status, setStatus] = useState<CourtStatus>(court?.status || 'ACTIVE');
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('El nombre de la cancha es requerido');
      return;
    }

    if (basePricePerHour < 0) {
      setError('El precio debe ser mayor o igual a 0');
      return;
    }

    setError(null);

    try {
      if (isEditing) {
        const updateData: UpdateCourtRequest = {
          name: name.trim(),
          sportType,
          description: description.trim() || undefined,
          surfaceType: surfaceType.trim() || undefined,
          isIndoor,
          basePricePerHour,
          status,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateCourtRequest = {
          facilityId,
          name: name.trim(),
          sportType,
          description: description.trim() || undefined,
          surfaceType: surfaceType.trim() || undefined,
          isIndoor,
          basePricePerHour,
          status,
        };
        await onSubmit(createData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-lg mx-4 my-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Cancha' : 'Nueva Cancha'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cancha 1"
              disabled={isSubmitting}
            />
          </div>

          {/* Sport Type */}
          <div className="space-y-2">
            <Label htmlFor="sportType">Tipo de Deporte *</Label>
            <div className="flex flex-wrap gap-2">
              {SPORT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={sportType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSportType(type.value)}
                  disabled={isSubmitting}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="basePricePerHour">Precio por Hora ({currencyCode}) *</Label>
            <Input
              id="basePricePerHour"
              type="number"
              min={0}
              step={100}
              value={basePricePerHour}
              onChange={(e) => setBasePricePerHour(parseFloat(e.target.value) || 0)}
              placeholder="15000"
              disabled={isSubmitting}
            />
          </div>

          {/* Indoor/Outdoor */}
          <div className="space-y-2">
            <Label>Tipo de Cancha</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isIndoor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsIndoor(false)}
                disabled={isSubmitting}
              >
                Descubierta
              </Button>
              <Button
                type="button"
                variant={isIndoor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsIndoor(true)}
                disabled={isSubmitting}
              >
                Techada
              </Button>
            </div>
          </div>

          {/* Surface Type */}
          <div className="space-y-2">
            <Label htmlFor="surfaceType">Tipo de Superficie (opcional)</Label>
            <Input
              id="surfaceType"
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value)}
              placeholder="Ej: Césped sintético, Cemento, etc."
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Cancha de 5 con iluminación LED"
              disabled={isSubmitting}
            />
          </div>

          {/* Status (only in edit mode) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex flex-wrap gap-2">
                {COURT_STATUSES.map((s) => (
                  <Button
                    key={s.value}
                    type="button"
                    variant={status === s.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus(s.value)}
                    disabled={isSubmitting}
                    className={
                      s.value === 'ACTIVE'
                        ? 'hover:bg-green-600'
                        : s.value === 'MAINTENANCE'
                        ? 'hover:bg-yellow-600'
                        : 'hover:bg-red-600'
                    }
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
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

// Status Change Modal
interface CourtStatusModalProps {
  court: Court;
  onSubmit: (status: CourtStatus) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CourtStatusModal({
  court,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CourtStatusModalProps) {
  const [status, setStatus] = useState<CourtStatus>(court.status);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      await onSubmit(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle>Cambiar Estado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Cambiando estado de: <strong>{court.name}</strong>
          </p>

          <div className="space-y-2">
            {COURT_STATUSES.map((s) => (
              <Button
                key={s.value}
                type="button"
                variant={status === s.value ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setStatus(s.value)}
                disabled={isSubmitting}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    s.value === 'ACTIVE'
                      ? 'bg-green-500'
                      : s.value === 'MAINTENANCE'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                {s.label}
              </Button>
            ))}
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
            disabled={isSubmitting || status === court.status}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              'Cambiar'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Delete Confirmation Modal
interface CourtDeleteModalProps {
  court: Court;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function CourtDeleteModal({
  court,
  onConfirm,
  onCancel,
  isDeleting = false,
}: CourtDeleteModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle className="text-destructive">Eliminar Cancha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <p className="text-sm">
            ¿Estás seguro de que querés eliminar la cancha <strong>{court.name}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            La cancha será desactivada y no estará disponible para reservas.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
