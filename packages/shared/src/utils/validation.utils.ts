// Validation utility functions
// Used for both frontend and backend validation

// Phone validation (Argentine format)
export function isValidPhone(phone: string): boolean {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Argentine mobile: 10-13 digits (with or without country code)
  // Examples: 1123456789, 5491123456789, 541123456789
  if (digits.length >= 10 && digits.length <= 13) {
    return true;
  }

  return false;
}

// Password strength validation
export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
}

export function validatePassword(password: string, minLength = 8): PasswordValidation {
  const hasMinLength = password.length >= minLength;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  return {
    isValid: hasMinLength && hasNumber && hasUppercase && hasLowercase,
    hasMinLength,
    hasNumber,
    hasUppercase,
    hasLowercase,
  };
}

// Slug validation
export function isValidSlug(slug: string): boolean {
  // Slug should be lowercase, alphanumeric, with hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

// Time format validation (HH:MM)
export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

// Date format validation (YYYY-MM-DD)
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);

  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

// Percentage validation (0-100)
export function isValidPercentage(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

// Price validation (positive number with max 2 decimals)
export function isValidPrice(value: number): boolean {
  return value > 0 && Number.isFinite(value) && Math.round(value * 100) / 100 === value;
}

// Operating hours validation (close time after open time)
export function isValidOperatingHours(openTime: string, closeTime: string): boolean {
  if (!isValidTime(openTime) || !isValidTime(closeTime)) return false;

  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  return closeMinutes > openMinutes;
}

// Booking time validation (within operating hours)
export function isWithinOperatingHours(
  startTime: string,
  endTime: string,
  openTime: string,
  closeTime: string
): boolean {
  if (!isValidTime(startTime) || !isValidTime(endTime)) return false;
  if (!isValidTime(openTime) || !isValidTime(closeTime)) return false;

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const open = parseTime(openTime);
  const close = parseTime(closeTime);

  return start >= open && end <= close && start < end;
}

// Booking notice validation (not too soon, not too far)
export function isValidBookingDate(
  date: string,
  minNoticeHours: number,
  maxAdvanceDays: number
): { isValid: boolean; error?: 'TOO_SOON' | 'TOO_FAR' } {
  if (!isValidDate(date)) return { isValid: false };

  const bookingDate = new Date(date);
  const now = new Date();

  // Calculate minimum allowed date
  const minDate = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  // Calculate maximum allowed date
  const maxDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);

  if (bookingDate < minDate) {
    return { isValid: false, error: 'TOO_SOON' };
  }

  if (bookingDate > maxDate) {
    return { isValid: false, error: 'TOO_FAR' };
  }

  return { isValid: true };
}
