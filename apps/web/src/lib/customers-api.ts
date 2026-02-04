// Customers API Functions
// Frontend API client for customer management

import { apiClient } from './api';

// ============================================
// Types
// ============================================

export type ReputationLevel = 'GOOD' | 'CAUTION' | 'POOR';

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  reputationScore: number;
  reputationLevel: ReputationLevel;
  totalBookings: number;
  noShowCount: number;
  isBlocked: boolean;
  lastBookingDate?: string;
}

export interface CustomerDetails {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  reputationScore: number;
  reputationLevel: ReputationLevel;
  totalBookings: number;
  completedBookings: number;
  noShowCount: number;
  cancellationCount: number;
  lateCancellationCount: number;
  creditBalance: number;
  notes?: string;
  isBlocked: boolean;
  blockedReason?: string;
  preferredCourtId?: string;
  preferredTime?: string;
  lastBookingDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNote {
  id: string;
  content: string;
  createdByName?: string;
  createdAt: string;
}

export interface ReputationHistoryEntry {
  id: string;
  changeType: string;
  changeAmount: number;
  previousScore: number;
  newScore: number;
  bookingId?: string;
  reason?: string;
  createdAt: string;
}

export interface CustomerWithRelations extends CustomerDetails {
  preferredCourtName?: string;
  recentNotes?: CustomerNote[];
  reputationHistory?: ReputationHistoryEntry[];
}

export interface PaginatedCustomers {
  data: CustomerSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  notes?: string;
  isBlocked?: boolean;
  blockedReason?: string;
}

export interface BlockCustomerRequest {
  block: boolean;
  reason?: string;
}

export interface UpdateReputationRequest {
  score: number;
  reason?: string;
}

export interface AddCreditRequest {
  amount: number;
  reason?: string;
}

export interface AddNoteRequest {
  content: string;
}

export interface QueryCustomerParams {
  page?: number;
  limit?: number;
  search?: string;
  reputationLevel?: ReputationLevel;
  isBlocked?: boolean;
  hasCredit?: boolean;
  hasBookingAfter?: string;
  sortBy?: 'name' | 'phone' | 'reputationScore' | 'totalBookings' | 'lastBookingDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// API Functions
// ============================================

export const customersApi = {
  /**
   * Get paginated list of customers
   */
  async list(params?: QueryCustomerParams): Promise<PaginatedCustomers> {
    return apiClient.get<PaginatedCustomers>('/customers', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * Get customer by ID with full details
   */
  async getById(id: string): Promise<CustomerWithRelations> {
    return apiClient.get<CustomerWithRelations>(`/customers/${id}`);
  },

  /**
   * Get customer by phone number
   */
  async getByPhone(phone: string): Promise<CustomerDetails | null> {
    return apiClient.get<CustomerDetails | null>(`/customers/phone/${encodeURIComponent(phone)}`);
  },

  /**
   * Create a new customer
   */
  async create(data: CreateCustomerRequest): Promise<CustomerDetails> {
    return apiClient.post<CustomerDetails>('/customers', data);
  },

  /**
   * Update customer information
   */
  async update(id: string, data: UpdateCustomerRequest): Promise<CustomerDetails> {
    return apiClient.patch<CustomerDetails>(`/customers/${id}`, data);
  },

  /**
   * Block or unblock a customer
   */
  async setBlocked(id: string, data: BlockCustomerRequest): Promise<CustomerDetails> {
    return apiClient.post<CustomerDetails>(`/customers/${id}/block`, data);
  },

  /**
   * Update customer reputation manually
   */
  async updateReputation(id: string, data: UpdateReputationRequest): Promise<CustomerDetails> {
    return apiClient.post<CustomerDetails>(`/customers/${id}/reputation`, data);
  },

  /**
   * Add credit to customer account
   */
  async addCredit(id: string, data: AddCreditRequest): Promise<CustomerDetails> {
    return apiClient.post<CustomerDetails>(`/customers/${id}/credit`, data);
  },

  /**
   * Add note to customer
   */
  async addNote(id: string, data: AddNoteRequest): Promise<CustomerNote> {
    return apiClient.post<CustomerNote>(`/customers/${id}/notes`, data);
  },

  /**
   * Get customer notes
   */
  async getNotes(id: string, limit?: number): Promise<CustomerNote[]> {
    return apiClient.get<CustomerNote[]>(`/customers/${id}/notes`, {
      params: limit ? { limit } : undefined,
    });
  },

  /**
   * Get customer reputation history
   */
  async getReputationHistory(id: string, limit?: number): Promise<ReputationHistoryEntry[]> {
    return apiClient.get<ReputationHistoryEntry[]>(`/customers/${id}/reputation-history`, {
      params: limit ? { limit } : undefined,
    });
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Reputation thresholds
 */
export const REPUTATION_THRESHOLDS = {
  GOOD_MIN: 80,
  CAUTION_MIN: 50,
} as const;

/**
 * Reputation changes by event
 */
export const REPUTATION_CHANGES = {
  COMPLETED: 5,
  NO_SHOW: -20,
  LATE_CANCELLATION: -10,
  EARLY_CANCELLATION: -5,
} as const;

/**
 * Get reputation level from score
 */
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= REPUTATION_THRESHOLDS.GOOD_MIN) return 'GOOD';
  if (score >= REPUTATION_THRESHOLDS.CAUTION_MIN) return 'CAUTION';
  return 'POOR';
}

/**
 * Get display label for reputation level
 */
export function getReputationLevelLabel(level: ReputationLevel): string {
  const labels: Record<ReputationLevel, string> = {
    GOOD: 'Bueno',
    CAUTION: 'Precaución',
    POOR: 'Malo',
  };
  return labels[level] || level;
}

/**
 * Get color for reputation level
 */
export function getReputationLevelColor(level: ReputationLevel): string {
  const colors: Record<ReputationLevel, string> = {
    GOOD: '#10B981', // green
    CAUTION: '#FBBF24', // yellow
    POOR: '#EF4444', // red
  };
  return colors[level] || '#6B7280';
}

/**
 * Get badge variant for reputation level
 */
export function getReputationBadgeVariant(
  level: ReputationLevel,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<ReputationLevel, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    GOOD: 'default',
    CAUTION: 'secondary',
    POOR: 'destructive',
  };
  return variants[level] || 'outline';
}

/**
 * Get label for reputation change type
 */
export function getReputationChangeLabel(changeType: string): string {
  const labels: Record<string, string> = {
    COMPLETED: 'Reserva completada',
    NO_SHOW: 'No se presentó',
    LATE_CANCELLATION: 'Cancelación tardía',
    EARLY_CANCELLATION: 'Cancelación anticipada',
    MANUAL: 'Ajuste manual',
  };
  return labels[changeType] || changeType;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Basic formatting - could be enhanced with libphonenumber
  return phone;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
