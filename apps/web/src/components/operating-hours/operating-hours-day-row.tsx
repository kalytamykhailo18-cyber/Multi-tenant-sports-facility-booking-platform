// Operating Hours Day Row Component
// Individual day row for the weekly schedule

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getDayName,
  SESSION_DURATION_OPTIONS,
  BUFFER_TIME_OPTIONS,
  generateTimeOptions,
  calculateSessionCount,
  type OperatingHours,
  type DayScheduleUpdate,
} from '@/lib/operating-hours-api';

interface OperatingHoursDayRowProps {
  day: OperatingHours | DayScheduleUpdate;
  dayOfWeek: number;
  onChange: (dayOfWeek: number, data: Partial<DayScheduleUpdate>) => void;
  showSessionConfig?: boolean;
  disabled?: boolean;
}

const TIME_OPTIONS = generateTimeOptions();

export function OperatingHoursDayRow({
  day,
  dayOfWeek,
  onChange,
  showSessionConfig = false,
  disabled = false,
}: OperatingHoursDayRowProps) {
  const dayName = getDayName(dayOfWeek);
  const isClosed = day.isClosed;

  // Calculate session count for display
  const sessionCount =
    !isClosed && day.openTime && day.closeTime
      ? calculateSessionCount(
          day.openTime,
          day.closeTime,
          day.sessionDurationMinutes || 60,
          day.bufferMinutes || 0,
        )
      : 0;

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-lg border ${
        isClosed ? 'bg-muted/50' : 'bg-background'
      }`}
    >
      {/* Day header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium w-24">{dayName}</span>
          <Button
            type="button"
            variant={isClosed ? 'outline' : 'default'}
            size="sm"
            onClick={() => onChange(dayOfWeek, { isClosed: !isClosed })}
            disabled={disabled}
          >
            {isClosed ? 'Cerrado' : 'Abierto'}
          </Button>
        </div>
        {!isClosed && sessionCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {sessionCount} sesiones
          </span>
        )}
      </div>

      {/* Time inputs (only when open) */}
      {!isClosed && (
        <div className="flex flex-wrap gap-4 items-end">
          {/* Open Time */}
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label htmlFor={`open-${dayOfWeek}`} className="text-xs">
              Apertura
            </Label>
            <select
              id={`open-${dayOfWeek}`}
              value={day.openTime}
              onChange={(e) => onChange(dayOfWeek, { openTime: e.target.value })}
              disabled={disabled}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Close Time */}
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label htmlFor={`close-${dayOfWeek}`} className="text-xs">
              Cierre
            </Label>
            <select
              id={`close-${dayOfWeek}`}
              value={day.closeTime}
              onChange={(e) => onChange(dayOfWeek, { closeTime: e.target.value })}
              disabled={disabled}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Session Duration (optional) */}
          {showSessionConfig && (
            <>
              <div className="flex-1 min-w-[140px] space-y-1">
                <Label htmlFor={`duration-${dayOfWeek}`} className="text-xs">
                  Duración Sesión
                </Label>
                <select
                  id={`duration-${dayOfWeek}`}
                  value={day.sessionDurationMinutes || 60}
                  onChange={(e) =>
                    onChange(dayOfWeek, {
                      sessionDurationMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  disabled={disabled}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {SESSION_DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buffer Time (optional) */}
              <div className="flex-1 min-w-[130px] space-y-1">
                <Label htmlFor={`buffer-${dayOfWeek}`} className="text-xs">
                  Buffer
                </Label>
                <select
                  id={`buffer-${dayOfWeek}`}
                  value={day.bufferMinutes || 0}
                  onChange={(e) =>
                    onChange(dayOfWeek, {
                      bufferMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  disabled={disabled}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {BUFFER_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
