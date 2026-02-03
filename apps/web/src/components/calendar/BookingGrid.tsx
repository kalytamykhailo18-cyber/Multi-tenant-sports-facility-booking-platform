// Booking Calendar Grid Component
// Displays the full calendar grid with all courts and time slots
// Optimized for mobile with swipe gestures and responsive design

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CourtColumn, CourtColumnSkeleton } from './CourtColumn';
import { TimeSlotLegend } from './TimeSlot';
import {
  type TimeSlot,
  type DaySlotsResponse,
} from '@/lib/bookings-api';

interface BookingGridProps {
  facilityId?: string;
  selectedDate: string;
  daySlots: DaySlotsResponse | null;
  loading?: boolean;
  error?: string | null;
  onSlotClick?: (slot: TimeSlot) => void;
  onSlotDragStart?: (slot: TimeSlot) => void;
  onSlotDrop?: (slot: TimeSlot) => void;
  onDateChange?: (date: string) => void;
  onRefresh?: () => void;
  showPrices?: boolean;
  currencyCode?: string;
  compact?: boolean;
}

// Swipe threshold for date navigation (in pixels)
const SWIPE_THRESHOLD = 50;

export function BookingGrid({
  facilityId,
  selectedDate,
  daySlots,
  loading = false,
  error = null,
  onSlotClick,
  onSlotDragStart,
  onSlotDrop,
  onDateChange,
  onRefresh,
  showPrices = false,
  currencyCode = 'ARS',
  compact: compactProp,
}: BookingGridProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch handling refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-compact on mobile unless explicitly set
  const compact = compactProp ?? isMobile;

  // Parse selected date for display
  const dateDisplay = useMemo(() => {
    const date = new Date(selectedDate + 'T00:00:00');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let dayLabel = date.toLocaleDateString('es-AR', { weekday: 'long' });
    if (selectedDate === today) dayLabel = 'Hoy';
    else if (selectedDate === tomorrow) dayLabel = 'Mañana';
    else if (selectedDate === yesterday) dayLabel = 'Ayer';

    return {
      dayName: dayLabel,
      shortDate: date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
      }),
      fullDate: date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isToday: selectedDate === today,
    };
  }, [selectedDate]);

  // Navigate dates with transition animation
  const navigateDate = useCallback((days: number) => {
    if (!onDateChange || isTransitioning) return;

    setIsTransitioning(true);
    setSwipeOffset(days > 0 ? -100 : 100);

    // Apply transition then change date
    setTimeout(() => {
      const current = new Date(selectedDate + 'T00:00:00');
      current.setDate(current.getDate() + days);
      onDateChange(current.toISOString().split('T')[0]);
      setSwipeOffset(0);
      setIsTransitioning(false);
    }, 150);
  }, [onDateChange, selectedDate, isTransitioning]);

  const goToToday = useCallback(() => {
    if (!onDateChange) return;
    onDateChange(new Date().toISOString().split('T')[0]);
  }, [onDateChange]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      // Prevent default only for horizontal swipes
      e.preventDefault();
      // Apply visual feedback (limited range)
      const offset = Math.max(-50, Math.min(50, deltaX / 3));
      setSwipeOffset(offset);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Navigate if swipe exceeds threshold
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        navigateDate(-1); // Swipe right = previous day
      } else {
        navigateDate(1); // Swipe left = next day
      }
    } else {
      setSwipeOffset(0);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [navigateDate]);

  // Group slots by time for the time labels column
  const timeLabels = useMemo(() => {
    if (!daySlots?.slots) return [];
    const uniqueTimes = new Set<string>();
    daySlots.slots.forEach((slot) => uniqueTimes.add(slot.startTime));
    return Array.from(uniqueTimes).sort();
  }, [daySlots?.slots]);

  // Calculate availability stats
  const stats = useMemo(() => {
    if (!daySlots?.slots) return null;
    const available = daySlots.slots.filter((s) => s.status === 'AVAILABLE' && !s.isLocked).length;
    const total = daySlots.slots.length;
    return { available, total };
  }, [daySlots?.slots]);

  // No facility selected state
  if (!facilityId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4 opacity-30">📅</div>
          <p className="text-muted-foreground">
            Selecciona un establecimiento para ver el calendario
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header - Responsive layout */}
      <CardHeader className="border-b py-3 px-3 sm:px-4">
        <div className="flex flex-col gap-3">
          {/* Date Navigation Row */}
          <div className="flex items-center justify-between">
            {/* Previous button */}
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'default'}
              onClick={() => navigateDate(-1)}
              disabled={loading || isTransitioning}
              className="shrink-0"
              aria-label="Día anterior"
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">←</span>
            </Button>

            {/* Date Display - Touch area for swipe hint */}
            <div
              className={cn(
                'text-center flex-1 mx-2 sm:mx-4 py-1',
                'transition-transform duration-150',
                isTransitioning && 'opacity-50',
              )}
              style={{
                transform: `translateX(${swipeOffset}px)`,
              }}
            >
              <h2 className={cn(
                'font-semibold capitalize',
                isMobile ? 'text-base' : 'text-lg',
                dateDisplay.isToday && 'text-primary',
              )}>
                {dateDisplay.dayName}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isMobile ? dateDisplay.shortDate : dateDisplay.fullDate}
              </p>
            </div>

            {/* Next button */}
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'default'}
              onClick={() => navigateDate(1)}
              disabled={loading || isTransitioning}
              className="shrink-0"
              aria-label="Día siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">→</span>
            </Button>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left actions */}
            <div className="flex items-center gap-2">
              {!dateDisplay.isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs"
                >
                  Hoy
                </Button>
              )}
              {stats && (
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  stats.available > 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                )}>
                  {stats.available} libre{stats.available !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? (
                    <Spinner className="w-3.5 h-3.5" />
                  ) : (
                    <span className="hidden sm:inline">Actualizar</span>
                  )}
                  {!loading && <span className="sm:hidden">↻</span>}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
                className="text-xs"
              >
                {showLegend ? 'Ocultar' : 'Leyenda'}
              </Button>
            </div>
          </div>

          {/* Legend - Collapsible with animation */}
          <div className={cn(
            'overflow-hidden transition-all duration-200',
            showLegend ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0',
          )}>
            <div className="pt-3 border-t">
              <TimeSlotLegend />
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0">
        {/* Loading state */}
        {loading && !daySlots && (
          <div className="flex overflow-x-auto">
            {/* Time column skeleton */}
            <div className={cn(
              'flex-shrink-0 border-r bg-muted/30',
              compact ? 'w-10' : 'w-14 sm:w-16',
            )}>
              <div className={cn(
                'sticky top-0 z-10 bg-muted/30 border-b text-center',
                compact ? 'p-1' : 'p-2',
              )}>
                <div className="h-4 w-8 bg-muted rounded mx-auto animate-pulse" />
              </div>
              <div className={cn(compact ? 'space-y-1 p-1' : 'space-y-1.5 p-1.5 sm:space-y-2 sm:p-2')}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-4 bg-muted rounded animate-pulse',
                      compact ? 'h-9' : 'h-[72px]',
                    )}
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
            </div>
            {/* Court column skeletons */}
            {Array.from({ length: isMobile ? 2 : 4 }).map((_, i) => (
              <CourtColumnSkeleton key={i} compact={compact} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-12 text-center px-4">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-destructive mb-4 text-sm">{error}</p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Reintentar
              </Button>
            )}
          </div>
        )}

        {/* Closed state */}
        {daySlots && !daySlots.isOpen && (
          <div className="py-12 text-center px-4">
            <div className="text-4xl mb-4">🚫</div>
            <p className="text-xl font-medium text-muted-foreground mb-2">
              Cerrado
            </p>
            {daySlots.specialHoursReason && (
              <p className="text-sm text-muted-foreground">
                {daySlots.specialHoursReason}
              </p>
            )}
          </div>
        )}

        {/* Calendar grid - with swipe support */}
        {daySlots && daySlots.isOpen && !error && (
          <div
            ref={gridRef}
            className={cn(
              'flex overflow-x-auto overscroll-x-contain',
              // Custom scrollbar styling
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
              // Transition for swipe animation
              'transition-transform duration-150',
            )}
            style={{
              WebkitOverflowScrolling: 'touch',
              transform: `translateX(${swipeOffset}px)`,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Time labels column */}
            <div className={cn(
              'flex-shrink-0 border-r bg-muted/30',
              compact ? 'w-10' : 'w-14 sm:w-16',
            )}>
              {/* Header spacer */}
              <div className={cn(
                'sticky top-0 z-10 bg-muted/30 border-b text-center',
                compact ? 'p-1' : 'p-2 sm:p-3',
              )}>
                <span className={cn(
                  'font-medium text-muted-foreground',
                  compact ? 'text-[10px]' : 'text-xs',
                )}>
                  Hora
                </span>
              </div>
              {/* Time labels */}
              <div className={cn(compact ? 'space-y-1 p-1' : 'space-y-1.5 p-1.5 sm:space-y-2 sm:p-2')}>
                {timeLabels.map((time) => (
                  <div
                    key={time}
                    className={cn(
                      'flex items-center justify-center font-medium text-muted-foreground',
                      compact
                        ? 'h-9 text-[10px]'
                        : 'h-[72px] text-xs',
                    )}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Court columns */}
            {daySlots.courts.length === 0 ? (
              <div className="flex-1 py-12 text-center">
                <div className="text-4xl mb-4 opacity-30">🏟️</div>
                <p className="text-muted-foreground">
                  No hay canchas configuradas
                </p>
              </div>
            ) : (
              daySlots.courts.map((court) => (
                <CourtColumn
                  key={court.id}
                  court={court}
                  slots={daySlots.slots}
                  onSlotClick={onSlotClick}
                  onSlotDragStart={onSlotDragStart}
                  onSlotDrop={onSlotDrop}
                  showPrices={showPrices}
                  currencyCode={currencyCode}
                  compact={compact}
                />
              ))
            )}
          </div>
        )}

        {/* Operating hours footer */}
        {daySlots && daySlots.isOpen && daySlots.openTime && daySlots.closeTime && (
          <div className={cn(
            'border-t px-3 py-2 flex flex-wrap items-center justify-between gap-2',
            'text-[11px] sm:text-xs text-muted-foreground bg-muted/20',
          )}>
            <span className="flex items-center gap-1">
              <span>🕐</span>
              {daySlots.openTime} - {daySlots.closeTime}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {stats?.available || 0} disponible{(stats?.available || 0) !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Mobile swipe hint - shown briefly on first load */}
        {isMobile && daySlots && daySlots.isOpen && (
          <div className="text-center py-1 text-[10px] text-muted-foreground/60">
            ← Desliza para cambiar de día →
          </div>
        )}
      </CardContent>
    </Card>
  );
}
