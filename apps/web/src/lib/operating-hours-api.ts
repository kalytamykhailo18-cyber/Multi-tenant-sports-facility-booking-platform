// Operating Hours API Functions
// Frontend API client for operating hours and special hours management

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export interface OperatingHours {
  id: string;
  tenantId: string;
  facilityId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed: boolean;
  sessionDurationMinutes: number;
  bufferMinutes: number;
  createdAt: string;
  updatedAt: string;
  dayName?: string;
}

export interface WeeklySchedule {
  facilityId: string;
  days: OperatingHours[];
  defaultSessionDurationMinutes: number;
  defaultBufferMinutes: number;
}

export interface SpecialHours {
  id: string;
  tenantId: string;
  facilityId: string;
  date: string; // ISO date string
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  formattedDate?: string;
}

export interface SpecialHoursListResponse {
  items: SpecialHours[];
  total: number;
}

export interface UpdateOperatingHoursRequest {
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
  sessionDurationMinutes?: number;
  bufferMinutes?: number;
}

export interface DayScheduleUpdate {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  sessionDurationMinutes?: number;
  bufferMinutes?: number;
}

export interface BulkUpdateOperatingHoursRequest {
  days: DayScheduleUpdate[];
  defaultSessionDurationMinutes?: number;
  defaultBufferMinutes?: number;
}

export interface CreateSpecialHoursRequest {
  facilityId: string;
  date: string; // YYYY-MM-DD format
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  reason?: string;
}

export interface UpdateSpecialHoursRequest {
  date?: string;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed?: boolean;
  reason?: string | null;
}

export interface QuerySpecialHoursParams {
  startDate?: string;
  endDate?: string;
  isClosed?: boolean;
  includePast?: boolean;
}

// ============================================
// API Functions
// ============================================

export const operatingHoursApi = {
  /**
   * Get weekly operating hours for a facility
   */
  async getByFacility(facilityId: string): Promise<WeeklySchedule> {
    return apiClient.get<WeeklySchedule>(`/operating-hours/facility/${facilityId}`);
  },

  /**
   * Update a single day's operating hours
   */
  async update(id: string, data: UpdateOperatingHoursRequest): Promise<OperatingHours> {
    return apiClient.patch<OperatingHours>(`/operating-hours/${id}`, data);
  },

  /**
   * Bulk update weekly schedule for a facility
   */
  async bulkUpdate(facilityId: string, data: BulkUpdateOperatingHoursRequest): Promise<WeeklySchedule> {
    return apiClient.put<WeeklySchedule>(`/operating-hours/facility/${facilityId}`, data);
  },

  /**
   * Create default operating hours for a new facility
   */
  async createDefaults(facilityId: string): Promise<OperatingHours[]> {
    return apiClient.post<OperatingHours[]>(`/operating-hours/facility/${facilityId}/defaults`);
  },

  /**
   * Get special hours for a facility
   */
  async getSpecialHours(facilityId: string, params?: QuerySpecialHoursParams): Promise<SpecialHoursListResponse> {
    return apiClient.get<SpecialHoursListResponse>(`/operating-hours/facility/${facilityId}/special`, {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Create special hours (holiday/closure)
   */
  async createSpecialHours(data: CreateSpecialHoursRequest): Promise<SpecialHours> {
    return apiClient.post<SpecialHours>('/operating-hours/special', data);
  },

  /**
   * Update special hours
   */
  async updateSpecialHours(id: string, data: UpdateSpecialHoursRequest): Promise<SpecialHours> {
    return apiClient.patch<SpecialHours>(`/operating-hours/special/${id}`, data);
  },

  /**
   * Delete special hours
   */
  async deleteSpecialHours(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/operating-hours/special/${id}`);
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Day names in Spanish
 */
export const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/**
 * Short day names in Spanish
 */
export const DAY_NAMES_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Get day name in Spanish
 */
export function getDayName(dayOfWeek: number, short = false): string {
  return short ? DAY_NAMES_SHORT_ES[dayOfWeek] : DAY_NAMES_ES[dayOfWeek];
}

/**
 * Session duration options
 */
export const SESSION_DURATION_OPTIONS = [
  { value: 60, label: '60 minutos (1 hora)' },
  { value: 90, label: '90 minutos (1.5 horas)' },
  { value: 120, label: '120 minutos (2 horas)' },
];

/**
 * Buffer time options
 */
export const BUFFER_TIME_OPTIONS = [
  { value: 0, label: 'Sin buffer' },
  { value: 10, label: '10 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
];

/**
 * Format time for display (24h format)
 */
export function formatTime(time: string): string {
  return time;
}

/**
 * Format time for display (12h format)
 */
export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate number of sessions for a day
 */
export function calculateSessionCount(
  openTime: string,
  closeTime: string,
  sessionDuration: number,
  bufferMinutes: number,
): number {
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  const totalMinutes = closeMinutes - openMinutes;

  const slotDuration = sessionDuration + bufferMinutes;
  return Math.floor(totalMinutes / slotDuration);
}

/**
 * Generate time options for select dropdowns (in 30-minute intervals)
 */
export function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push({ value, label: value });
    }
  }

  return options;
}

/**
 * Common closure reasons in Spanish
 */
export const CLOSURE_REASONS = [
  'Feriado',
  'Mantenimiento',
  'Vacaciones',
  'Evento privado',
  'Clima adverso',
  'Otro',
];

/**
 * Format date for display in Spanish
 */
export function formatDateES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${day} de ${monthNames[d.getMonth()]}`;
}

/**
 * Get default weekly schedule (for initializing form)
 */
export function getDefaultWeeklySchedule(): DayScheduleUpdate[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '08:00',
    closeTime: '23:00',
    isClosed: false,
    sessionDurationMinutes: 60,
    bufferMinutes: 0,
  }));
}
