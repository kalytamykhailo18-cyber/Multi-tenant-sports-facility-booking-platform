// Date utility functions
// All dates are stored in UTC, displayed in local timezone

/**
 * Format a date for display in the specified timezone
 * @param date - Date to format
 * @param timezone - IANA timezone (e.g., 'America/Argentina/Buenos_Aires')
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  date: Date | string,
  timezone: string = 'America/Argentina/Buenos_Aires',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', { ...options, timeZone: timezone });
}

/**
 * Format a time for display
 * @param date - Date to format
 * @param timezone - IANA timezone
 */
export function formatTime(
  date: Date | string,
  timezone: string = 'America/Argentina/Buenos_Aires'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string,
  timezone: string = 'America/Argentina/Buenos_Aires'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

/**
 * Get start of day in UTC
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in UTC
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  );
}

/**
 * Calculate hours difference between two dates
 */
export function hoursDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return diffMs / (1000 * 60 * 60);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setTime(d.getTime() + minutes * 60 * 1000);
  return d;
}

/**
 * Parse a date string in YYYY-MM-DD format
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Format a date to YYYY-MM-DD format
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get day of week name in Spanish
 */
export function getDayName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', { weekday: 'long' });
}

/**
 * Get short day of week name in Spanish
 */
export function getShortDayName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', { weekday: 'short' });
}

/**
 * Get start of week (Monday) in UTC
 */
export function startOfWeek(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday) in UTC
 */
export function endOfWeek(date: Date | string): Date {
  const d = startOfWeek(date);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month in UTC
 */
export function startOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of month in UTC
 */
export function endOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Calculate minutes difference between two dates
 */
export function minutesDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return diffMs / (1000 * 60);
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return (
    d.getUTCFullYear() === tomorrow.getUTCFullYear() &&
    d.getUTCMonth() === tomorrow.getUTCMonth() &&
    d.getUTCDate() === tomorrow.getUTCDate()
  );
}

/**
 * Check if a date is within the next N days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const future = addDays(now, days);
  return d.getTime() >= now.getTime() && d.getTime() <= future.getTime();
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 60) {
    if (diffMins < 0) return `hace ${Math.abs(diffMins)} minutos`;
    if (diffMins === 0) return 'ahora';
    return `en ${diffMins} minutos`;
  }

  if (Math.abs(diffHours) < 24) {
    if (diffHours < 0) return `hace ${Math.abs(diffHours)} horas`;
    return `en ${diffHours} horas`;
  }

  if (diffDays < 0) return `hace ${Math.abs(diffDays)} días`;
  return `en ${diffDays} días`;
}

/**
 * Parse time string (HH:MM) to minutes from midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight to time string (HH:MM)
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Combine date and time string into a Date object
 */
export function combineDateAndTime(
  dateStr: string,
  timeStr: string,
  timezone: string = 'America/Argentina/Buenos_Aires'
): Date {
  // Parse date as YYYY-MM-DD and time as HH:MM
  const dateTimeStr = `${dateStr}T${timeStr}:00`;

  // Create date in the specified timezone
  const date = new Date(dateTimeStr);

  // For proper timezone handling, we'd need a library like date-fns-tz
  // For now, return the basic date
  return date;
}
