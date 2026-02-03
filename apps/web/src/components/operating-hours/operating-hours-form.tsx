// Operating Hours Form Component
// Form for editing weekly operating hours schedule

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { OperatingHoursDayRow } from './operating-hours-day-row';
import {
  SESSION_DURATION_OPTIONS,
  BUFFER_TIME_OPTIONS,
  getDefaultWeeklySchedule,
  type WeeklySchedule,
  type DayScheduleUpdate,
  type BulkUpdateOperatingHoursRequest,
} from '@/lib/operating-hours-api';

interface OperatingHoursFormProps {
  weeklySchedule: WeeklySchedule | null;
  facilityId: string;
  onSubmit: (data: BulkUpdateOperatingHoursRequest) => Promise<void>;
  onCreateDefaults?: () => Promise<void>;
  isSubmitting?: boolean;
  isCreatingDefaults?: boolean;
}

export function OperatingHoursForm({
  weeklySchedule,
  facilityId,
  onSubmit,
  onCreateDefaults,
  isSubmitting = false,
  isCreatingDefaults = false,
}: OperatingHoursFormProps) {
  // Form state - days array
  const [days, setDays] = useState<DayScheduleUpdate[]>(() =>
    weeklySchedule?.days
      ? weeklySchedule.days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          openTime: d.openTime,
          closeTime: d.closeTime,
          isClosed: d.isClosed,
          sessionDurationMinutes: d.sessionDurationMinutes,
          bufferMinutes: d.bufferMinutes,
        }))
      : getDefaultWeeklySchedule(),
  );

  // Default values for all days
  const [defaultSessionDuration, setDefaultSessionDuration] = useState(
    weeklySchedule?.defaultSessionDurationMinutes || 60,
  );
  const [defaultBuffer, setDefaultBuffer] = useState(
    weeklySchedule?.defaultBufferMinutes || 0,
  );

  // Show per-day session config
  const [showPerDayConfig, setShowPerDayConfig] = useState(false);

  // Local error state
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when schedule changes
  useEffect(() => {
    if (weeklySchedule?.days) {
      setDays(
        weeklySchedule.days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          openTime: d.openTime,
          closeTime: d.closeTime,
          isClosed: d.isClosed,
          sessionDurationMinutes: d.sessionDurationMinutes,
          bufferMinutes: d.bufferMinutes,
        })),
      );
      setDefaultSessionDuration(weeklySchedule.defaultSessionDurationMinutes);
      setDefaultBuffer(weeklySchedule.defaultBufferMinutes);
      setHasChanges(false);
    }
  }, [weeklySchedule]);

  // Handle day change
  const handleDayChange = (dayOfWeek: number, data: Partial<DayScheduleUpdate>) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...data } : d)),
    );
    setHasChanges(true);
  };

  // Apply default values to all days
  const applyDefaultsToAllDays = () => {
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        sessionDurationMinutes: defaultSessionDuration,
        bufferMinutes: defaultBuffer,
      })),
    );
    setHasChanges(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);

    // Validation: check that close time is after open time for open days
    for (const day of days) {
      if (!day.isClosed) {
        if (day.openTime >= day.closeTime) {
          setError(
            `El horario de cierre debe ser posterior al de apertura para los días abiertos`,
          );
          return;
        }
      }
    }

    try {
      const data: BulkUpdateOperatingHoursRequest = {
        days,
        defaultSessionDurationMinutes: defaultSessionDuration,
        defaultBufferMinutes: defaultBuffer,
      };
      await onSubmit(data);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar horarios');
    }
  };

  // Handle creating default hours
  const handleCreateDefaults = async () => {
    if (!onCreateDefaults) return;
    setError(null);
    try {
      await onCreateDefaults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear horarios');
    }
  };

  // If no schedule exists, show create defaults button
  if (!weeklySchedule && onCreateDefaults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Horarios de Operación</CardTitle>
          <CardDescription>
            No se han configurado horarios para esta instalación. Crear horarios predeterminados
            para comenzar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateDefaults} disabled={isCreatingDefaults}>
            {isCreatingDefaults ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creando...
              </>
            ) : (
              'Crear Horarios Predeterminados'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios de Operación</CardTitle>
        <CardDescription>
          Configure los horarios de apertura y cierre para cada día de la semana.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Default session settings */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Configuración de Sesiones</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPerDayConfig(!showPerDayConfig)}
            >
              {showPerDayConfig ? 'Ocultar Config. por Día' : 'Mostrar Config. por Día'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Default Session Duration */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="defaultDuration" className="text-sm">
                Duración de Sesión (predeterminada)
              </Label>
              <select
                id="defaultDuration"
                value={defaultSessionDuration}
                onChange={(e) => {
                  setDefaultSessionDuration(parseInt(e.target.value, 10));
                  setHasChanges(true);
                }}
                disabled={isSubmitting}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {SESSION_DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Buffer Time */}
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label htmlFor="defaultBuffer" className="text-sm">
                Tiempo Buffer (predeterminado)
              </Label>
              <select
                id="defaultBuffer"
                value={defaultBuffer}
                onChange={(e) => {
                  setDefaultBuffer(parseInt(e.target.value, 10));
                  setHasChanges(true);
                }}
                disabled={isSubmitting}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {BUFFER_TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Apply to all button */}
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={applyDefaultsToAllDays}
                disabled={isSubmitting}
              >
                Aplicar a Todos
              </Button>
            </div>
          </div>
        </div>

        {/* Days list */}
        <div className="space-y-3">
          {days
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((day) => (
              <OperatingHoursDayRow
                key={day.dayOfWeek}
                day={day}
                dayOfWeek={day.dayOfWeek}
                onChange={handleDayChange}
                showSessionConfig={showPerDayConfig}
                disabled={isSubmitting}
              />
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          {hasChanges && 'Hay cambios sin guardar'}
        </p>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !hasChanges}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Guardando...
            </>
          ) : (
            'Guardar Horarios'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
