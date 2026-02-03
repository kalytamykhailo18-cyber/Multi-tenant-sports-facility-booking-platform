// Customer related types
// Types for customer management (WhatsApp customers)

// Reputation levels
export type ReputationLevel = 'GOOD' | 'CAUTION' | 'POOR';

// Reputation level labels
export const REPUTATION_LEVEL_LABELS: Record<ReputationLevel, string> = {
  GOOD: 'Bueno',
  CAUTION: 'Precaución',
  POOR: 'Malo',
};

// Reputation level colors
export const REPUTATION_LEVEL_COLORS: Record<ReputationLevel, string> = {
  GOOD: '#10B981', // green
  CAUTION: '#FBBF24', // yellow
  POOR: '#EF4444', // red
};

// Reputation thresholds
export const REPUTATION_THRESHOLDS = {
  GOOD_MIN: 80,
  CAUTION_MIN: 50,
} as const;

// Customer summary for listing
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

// Customer details
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

// Create customer input
export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

// Update customer input
export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  notes?: string;
  isBlocked?: boolean;
  blockedReason?: string;
}

// Customer filter options
export interface CustomerFilters {
  search?: string;
  reputationLevel?: ReputationLevel;
  isBlocked?: boolean;
  hasCredit?: boolean;
  hasBookingAfter?: string;
}

// Reputation change event
export interface ReputationChange {
  customerId: string;
  changeType: 'COMPLETED' | 'NO_SHOW' | 'EARLY_CANCEL' | 'LATE_CANCEL' | 'MANUAL';
  changeAmount: number;
  previousScore: number;
  newScore: number;
  bookingId?: string;
  reason?: string;
  createdAt: string;
}

// Get reputation level from score
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= REPUTATION_THRESHOLDS.GOOD_MIN) return 'GOOD';
  if (score >= REPUTATION_THRESHOLDS.CAUTION_MIN) return 'CAUTION';
  return 'POOR';
}

// Calculate reputation change
export const REPUTATION_CHANGES = {
  COMPLETED: 5,
  NO_SHOW: -20,
  LATE_CANCELLATION: -10,
  EARLY_CANCELLATION: -5,
} as const;
