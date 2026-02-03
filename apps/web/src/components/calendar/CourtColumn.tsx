// Court Column Component
// Displays a single court's time slots for the day
// Optimized for mobile with smooth scrolling and touch interactions

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { TimeSlot } from './TimeSlot';
import { type TimeSlot as TimeSlotType, type CourtInfo } from '@/lib/bookings-api';
import { getSportTypeLabel, getSportTypeIcon, type SportType } from '@/lib/courts-api';

interface CourtColumnProps {
  court: CourtInfo;
  slots: TimeSlotType[];
  onSlotClick?: (slot: TimeSlotType) => void;
  onSlotDragStart?: (slot: TimeSlotType) => void;
  onSlotDrop?: (slot: TimeSlotType) => void;
  showPrices?: boolean;
  currencyCode?: string;
  compact?: boolean;
  className?: string;
}

export function CourtColumn({
  court,
  slots,
  onSlotClick,
  onSlotDragStart,
  onSlotDrop,
  showPrices = false,
  currencyCode = 'ARS',
  compact = false,
  className,
}: CourtColumnProps) {
  // Filter and sort slots for this court - memoized for performance
  const courtSlots = useMemo(() => {
    return slots
      .filter((s) => s.courtId === court.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, court.id]);

  // Calculate stats - memoized
  const stats = useMemo(() => {
    const available = courtSlots.filter(
      (s) => s.status === 'AVAILABLE' && !s.isLocked
    ).length;
    const booked = courtSlots.filter(
      (s) => s.status !== 'AVAILABLE' || s.isLocked
    ).length;
    return { available, booked, total: courtSlots.length };
  }, [courtSlots]);

  // Get sport type icon emoji
  const sportIcon = getSportTypeIcon(court.sportType as SportType);

  return (
    <div
      className={cn(
        'flex flex-col border-r last:border-r-0 bg-background',
        // Responsive widths
        compact
          ? 'min-w-[90px] w-[90px] sm:min-w-[100px] sm:w-[100px]'
          : 'min-w-[140px] w-[140px] sm:min-w-[160px] sm:w-[160px] md:min-w-[180px] md:w-[180px]',
        // Smooth transitions
        'transition-all duration-200',
        className,
      )}
    >
      {/* Header - Sticky with shadow when scrolled */}
      <div className={cn(
        'sticky top-0 z-10 bg-background border-b',
        'shadow-sm',
        compact ? 'p-1.5' : 'p-2 sm:p-3',
      )}>
        <div className="flex flex-col items-center text-center">
          {/* Sport icon and name */}
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-sm" role="img" aria-label={court.sportType}>
              {sportIcon}
            </span>
            <h3 className={cn(
              'font-semibold truncate',
              compact ? 'text-xs max-w-[70px]' : 'text-sm max-w-[120px] sm:max-w-[140px]',
            )}>
              {court.name}
            </h3>
          </div>

          {/* Sport type label */}
          <span className={cn(
            'text-muted-foreground',
            compact ? 'text-[10px]' : 'text-xs',
          )}>
            {getSportTypeLabel(court.sportType as SportType)}
          </span>

          {/* Stats - hidden in compact mode */}
          {!compact && stats.total > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium">
              <span className="inline-flex items-center gap-0.5 text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {stats.available}
              </span>
              <span className="text-muted-foreground/50">/</span>
              <span className="inline-flex items-center gap-0.5 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {stats.booked}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Slots container with smooth scrolling */}
      <div
        className={cn(
          'flex-1 overflow-y-auto overscroll-contain',
          // Custom scrollbar styling
          'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
          // Padding and spacing
          compact ? 'space-y-1 p-1' : 'space-y-1.5 p-1.5 sm:space-y-2 sm:p-2',
        )}
        style={{
          // Enable smooth scrolling on touch devices
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {courtSlots.length === 0 ? (
          <div className={cn(
            'text-center text-muted-foreground py-8 px-2',
            compact ? 'text-xs' : 'text-sm',
          )}>
            <div className="text-2xl mb-2 opacity-30">📅</div>
            Sin horarios
          </div>
        ) : (
          courtSlots.map((slot) => (
            <TimeSlot
              key={`${slot.courtId}-${slot.startTime}`}
              slot={slot}
              onClick={onSlotClick}
              onDragStart={onSlotDragStart}
              onDrop={onSlotDrop}
              compact={compact}
              showPrice={showPrices}
              currencyCode={currencyCode}
            />
          ))
        )}
      </div>

      {/* Footer with availability summary - only on non-compact */}
      {!compact && stats.total > 0 && (
        <div className={cn(
          'border-t px-2 py-1.5 text-center',
          'bg-muted/30 text-[10px] text-muted-foreground font-medium',
        )}>
          {stats.available > 0 ? (
            <span className="text-green-600">
              {stats.available} disponible{stats.available !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-orange-600">Completo</span>
          )}
        </div>
      )}
    </div>
  );
}

// Placeholder column shown during loading - with animated shimmer effect
export function CourtColumnSkeleton({ compact = false }: { compact?: boolean }) {
  const skeletonCount = compact ? 6 : 8;

  return (
    <div
      className={cn(
        'flex flex-col border-r last:border-r-0',
        compact
          ? 'min-w-[90px] w-[90px] sm:min-w-[100px] sm:w-[100px]'
          : 'min-w-[140px] w-[140px] sm:min-w-[160px] sm:w-[160px] md:min-w-[180px] md:w-[180px]',
      )}
    >
      {/* Header skeleton */}
      <div className={cn(
        'sticky top-0 z-10 bg-background border-b',
        compact ? 'p-1.5' : 'p-2 sm:p-3',
      )}>
        <div className="flex flex-col items-center gap-1.5">
          <div className={cn(
            'bg-muted rounded animate-pulse',
            compact ? 'h-3 w-14' : 'h-4 w-20',
          )} />
          <div className={cn(
            'bg-muted rounded animate-pulse',
            compact ? 'h-2.5 w-10' : 'h-3 w-14',
          )} />
          {!compact && (
            <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
          )}
        </div>
      </div>

      {/* Slots skeleton */}
      <div className={cn(
        'flex-1',
        compact ? 'space-y-1 p-1' : 'space-y-1.5 p-1.5 sm:space-y-2 sm:p-2',
      )}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-lg bg-muted animate-pulse',
              compact ? 'h-9' : 'h-[72px]',
            )}
            style={{
              // Stagger animation for visual interest
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
