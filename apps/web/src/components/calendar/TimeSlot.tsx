// Time Slot Component
// Displays a single time slot in the calendar grid
// Optimized for mobile touch interactions and smooth animations

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import {
  type TimeSlot as TimeSlotType,
  type BookingStatus,
  getBookingStatusColor,
  getBookingStatusTextColor,
  getBookingStatusLabel,
  formatTime,
  formatPrice,
} from '@/lib/bookings-api';

interface TimeSlotProps {
  slot: TimeSlotType;
  onClick?: (slot: TimeSlotType) => void;
  onDragStart?: (slot: TimeSlotType) => void;
  onDrop?: (slot: TimeSlotType) => void;
  onTouchHold?: (slot: TimeSlotType) => void;
  compact?: boolean;
  showPrice?: boolean;
  currencyCode?: string;
}

export function TimeSlot({
  slot,
  onClick,
  onDragStart,
  onDrop,
  onTouchHold,
  compact = false,
  showPrice = false,
  currencyCode = 'ARS',
}: TimeSlotProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isAvailable = slot.status === 'AVAILABLE' && !slot.isLocked;
  const isBooked = !isAvailable;
  const isDraggable = isBooked && slot.booking && onDragStart;
  const isDroppable = isAvailable && onDrop;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(slot);
    }
  }, [onClick, slot]);

  // Touch handling for mobile
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (isDraggable && onDragStart) {
      e.dataTransfer.setData('text/plain', JSON.stringify(slot));
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(slot);
    }
  }, [isDraggable, onDragStart, slot]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isDroppable) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  }, [isDroppable]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (isDroppable && onDrop) {
      e.preventDefault();
      setIsDragOver(false);
      onDrop(slot);
    }
  }, [isDroppable, onDrop, slot]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const statusColor = getBookingStatusColor(slot.status);
  const textColor = getBookingStatusTextColor(slot.status);

  // Compact view for mobile or dense calendar
  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={cn(
          // Base styles
          'w-full p-1.5 rounded border text-xs font-medium',
          // Transition for smooth animations
          'transition-all duration-150 ease-out',
          // Status colors
          statusColor,
          textColor,
          // Interactive states
          'cursor-pointer select-none',
          'active:scale-95 active:brightness-95',
          // Touch feedback
          isPressed && 'scale-95 brightness-95',
          // Locked state
          slot.isLocked && 'opacity-70 cursor-not-allowed',
          // Hover on desktop
          'md:hover:brightness-110',
        )}
        title={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
        aria-label={`${slot.startTime} - ${isAvailable ? 'Disponible' : slot.booking?.customerName || getBookingStatusLabel(slot.status)}`}
      >
        <span className="block truncate">{slot.startTime}</span>
        {slot.booking && (
          <span className="block truncate text-[10px] opacity-80">
            {slot.booking.customerName.split(' ')[0]}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        // Base styles
        'relative w-full p-2.5 rounded-lg border',
        // Smooth transitions
        'transition-all duration-150 ease-out',
        // Status colors
        statusColor,
        textColor,
        // Interactive states
        'cursor-pointer select-none',
        // Touch feedback
        isPressed && 'scale-[0.98] brightness-95',
        // Desktop hover
        'md:hover:brightness-105 md:hover:shadow-sm',
        // Drag states
        isDraggable && 'cursor-grab active:cursor-grabbing',
        isDragOver && 'ring-2 ring-primary ring-offset-1 scale-105',
        isDroppable && 'md:hover:ring-2 md:hover:ring-primary/50',
        // Locked state
        slot.isLocked && 'opacity-70 cursor-not-allowed',
      )}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      draggable={!!isDraggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${formatTime(slot.startTime)} - ${isAvailable ? 'Disponible' : slot.booking?.customerName || getBookingStatusLabel(slot.status)}`}
    >
      {/* Time Header */}
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-sm font-semibold">
          {formatTime(slot.startTime)}
        </span>
        <span className="text-[11px] opacity-70 font-medium">
          {slot.durationMinutes}min
        </span>
      </div>

      {/* Status / Customer Info */}
      <div className="text-xs min-h-[1.25rem]">
        {isAvailable ? (
          <span className="font-medium">
            {slot.isLocked ? 'Reservando...' : 'Disponible'}
          </span>
        ) : slot.booking ? (
          <div className="space-y-0.5">
            <div className="truncate font-medium">
              {slot.booking.customerName}
            </div>
            {slot.booking.customerPhone && (
              <div className="truncate text-[10px] opacity-70">
                {slot.booking.customerPhone}
              </div>
            )}
          </div>
        ) : (
          <span className="font-medium">
            {getBookingStatusLabel(slot.status)}
          </span>
        )}
      </div>

      {/* Price (optional) */}
      {showPrice && isAvailable && !slot.isLocked && (
        <div className="mt-1.5 pt-1.5 border-t border-current/10 text-xs font-bold">
          {formatPrice(slot.price, currencyCode)}
        </div>
      )}

      {/* Lock indicator - animated */}
      {slot.isLocked && (
        <div className="absolute top-1.5 right-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse"
            title="Siendo reservado por otro usuario"
          />
        </div>
      )}

      {/* Drag handle indicator for booked slots */}
      {isDraggable && (
        <div className="absolute bottom-1 right-1 opacity-40 text-[10px]">
          ⋮⋮
        </div>
      )}
    </div>
  );
}

// Status legend component - optimized for mobile with flex wrap
export function TimeSlotLegend() {
  const statuses: BookingStatus[] = [
    'AVAILABLE',
    'RESERVED',
    'PAID',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
      {statuses.map((status) => (
        <div key={status} className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              'w-3 h-3 rounded border shadow-sm',
              getBookingStatusColor(status),
            )}
          />
          <span className="text-muted-foreground whitespace-nowrap">
            {getBookingStatusLabel(status)}
          </span>
        </div>
      ))}
    </div>
  );
}
