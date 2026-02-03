// Special Hours Form Component
// Form for creating and editing special hours (holidays/closures)

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  CLOSURE_REASONS,
  generateTimeOptions,
  type SpecialHours,
  type CreateSpecialHoursRequest,
  type UpdateSpecialHoursRequest,
} from '@/lib/operating-hours-api';

interface SpecialHoursFormProps {
  specialHours?: SpecialHours;
  facilityId: string;
  onSubmit: (data: CreateSpecialHoursRequest | (UpdateSpecialHoursRequest & { id: string })) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TIME_OPTIONS = generateTimeOptions();

export function SpecialHoursForm({
  specialHours,
  facilityId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SpecialHoursFormProps) {
  const isEditing = !!specialHours;

  // Form state
  const [date, setDate] = useState(
    specialHours?.date
      ? new Date(specialHours.date).toISOString().split('T')[0]
      : '',
  );
  const [isClosed, setIsClosed] = useState(specialHours?.isClosed ?? true);
  const [openTime, setOpenTime] = useState(specialHours?.openTime || '08:00');
  const [closeTime, setCloseTime] = useState(specialHours?.closeTime || '23:00');
  const [reason, setReason] = useState(specialHours?.reason || '');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle reason selection
  const handleReasonChange = (selectedReason: string) => {
    if (selectedReason === 'Otro') {
      setReason('');
    } else {
      setReason(selectedReason);
      setCustomReason('');
    }
  };

  // Determine if custom reason is being used
  const isCustomReason = reason && !CLOSURE_REASONS.includes(reason);
  const displayReason = isCustomReason ? reason : '';

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!date) {
      setError('La fecha es requerida');
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today && !isEditing) {
      setError('La fecha no puede ser en el pasado');
      return;
    }

    if (!isClosed && openTime >= closeTime) {
      setError('El horario de cierre debe ser posterior al de apertura');
      return;
    }

    setError(null);

    try {
      const finalReason = customReason || reason || null;

      if (isEditing) {
        const updateData: UpdateSpecialHoursRequest & { id: string } = {
          id: specialHours.id,
          date,
          isClosed,
          openTime: isClosed ? null : openTime,
          closeTime: isClosed ? null : closeTime,
          reason: finalReason,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateSpecialHoursRequest = {
          facilityId,
          date,
          isClosed,
          openTime: isClosed ? undefined : openTime,
          closeTime: isClosed ? undefined : closeTime,
          reason: finalReason || undefined,
        };
        await onSubmit(createData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-md mx-4 my-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Horario Especial' : 'Nuevo Horario Especial'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Closure Type */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isClosed ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsClosed(true)}
                disabled={isSubmitting}
              >
                Cerrado
              </Button>
              <Button
                type="button"
                variant={!isClosed ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsClosed(false)}
                disabled={isSubmitting}
              >
                Horario Especial
              </Button>
            </div>
          </div>

          {/* Time inputs (only when not fully closed) */}
          {!isClosed && (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="openTime">Apertura</Label>
                <select
                  id="openTime"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="closeTime">Cierre</Label>
                <select
                  id="closeTime"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Reason selection */}
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <div className="flex flex-wrap gap-2">
              {CLOSURE_REASONS.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={reason === r || (r === 'Otro' && isCustomReason) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleReasonChange(r)}
                  disabled={isSubmitting}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom reason input */}
          {(reason === '' && CLOSURE_REASONS.every((r) => reason !== r)) ||
          isCustomReason ||
          customReason ? (
            <div className="space-y-2">
              <Label htmlFor="customReason">Motivo personalizado</Label>
              <Input
                id="customReason"
                value={customReason || displayReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ej: Evento corporativo"
                disabled={isSubmitting}
              />
            </div>
          ) : null}
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
            disabled={isSubmitting || !date}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : isEditing ? (
              'Guardar'
            ) : (
              'Crear'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Delete Confirmation Modal
interface SpecialHoursDeleteModalProps {
  specialHours: SpecialHours;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function SpecialHoursDeleteModal({
  specialHours,
  onConfirm,
  onCancel,
  isDeleting = false,
}: SpecialHoursDeleteModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formattedDate = new Date(specialHours.date).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle className="text-destructive">Eliminar Horario Especial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <p className="text-sm">
            ¿Estás seguro de que querés eliminar el horario especial del{' '}
            <strong>{formattedDate}</strong>?
          </p>
          {specialHours.reason && (
            <p className="text-sm text-muted-foreground">
              Motivo: {specialHours.reason}
            </p>
          )}
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
