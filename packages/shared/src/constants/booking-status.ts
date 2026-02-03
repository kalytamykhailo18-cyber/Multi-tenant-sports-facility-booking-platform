// Booking Status Constants with display labels
// Used for calendar colors and validation

export const BOOKING_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export const BOOKING_STATUS_LABELS = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  PAID: 'Pagado',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'No se presentó',
} as const;

export const BOOKING_STATUS_COLORS = {
  AVAILABLE: '#9CA3AF', // gray
  RESERVED: '#FBBF24', // yellow
  PAID: '#3B82F6', // blue
  CONFIRMED: '#10B981', // green
  COMPLETED: '#8B5CF6', // purple
  CANCELLED: '#EF4444', // red
  NO_SHOW: '#F97316', // orange
} as const;

// Tenant Status
export const TENANT_STATUS_LABELS = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
} as const;

// Facility Status
export const FACILITY_STATUS_LABELS = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  INACTIVE: 'Inactivo',
} as const;

// Court Status
export const COURT_STATUS_LABELS = {
  ACTIVE: 'Activo',
  MAINTENANCE: 'En mantenimiento',
  INACTIVE: 'Inactivo',
} as const;

// Sport Type
export const SPORT_TYPE_LABELS = {
  SOCCER: 'Fútbol',
  PADEL: 'Pádel',
  TENNIS: 'Tenis',
  MULTI: 'Múltiple',
} as const;

export const SPORT_TYPE_ICONS = {
  SOCCER: '⚽',
  PADEL: '🎾',
  TENNIS: '🎾',
  MULTI: '🏟️',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
  REFUNDED: 'Reembolsado',
} as const;

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  DUE_SOON: 'DUE_SOON',
  OVERDUE: 'OVERDUE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_LABELS = {
  ACTIVE: 'Activo',
  DUE_SOON: 'Próximo a vencer',
  OVERDUE: 'Vencido',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
} as const;

export const SUBSCRIPTION_STATUS_COLORS = {
  ACTIVE: '#10B981', // green
  DUE_SOON: '#FBBF24', // yellow
  OVERDUE: '#F97316', // orange
  SUSPENDED: '#EF4444', // red
  CANCELLED: '#6B7280', // gray
} as const;

// Slot Lock Status (for race condition prevention)
export const SLOT_LOCK_STATUS = {
  AVAILABLE: 'AVAILABLE',
  LOCKED: 'LOCKED',
  BOOKED: 'BOOKED',
} as const;

export type SlotLockStatus = typeof SLOT_LOCK_STATUS[keyof typeof SLOT_LOCK_STATUS];

// Waiting List Status
export const WAITING_LIST_STATUS = {
  WAITING: 'WAITING',
  NOTIFIED: 'NOTIFIED',
  BOOKED: 'BOOKED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type WaitingListStatus = typeof WAITING_LIST_STATUS[keyof typeof WAITING_LIST_STATUS];

export const WAITING_LIST_STATUS_LABELS = {
  WAITING: 'En espera',
  NOTIFIED: 'Notificado',
  BOOKED: 'Reservado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
} as const;

// Escalation Status (for AI bot handoff)
export const ESCALATION_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export type EscalationStatus = typeof ESCALATION_STATUS[keyof typeof ESCALATION_STATUS];

export const ESCALATION_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
} as const;

// Conversation Intent Types (for AI bot)
export const CONVERSATION_INTENTS = {
  GREETING: 'GREETING',
  CHECK_AVAILABILITY: 'CHECK_AVAILABILITY',
  MAKE_BOOKING: 'MAKE_BOOKING',
  CANCEL_BOOKING: 'CANCEL_BOOKING',
  RESCHEDULE: 'RESCHEDULE',
  CHECK_BOOKING: 'CHECK_BOOKING',
  FIND_OPPONENT: 'FIND_OPPONENT',
  CONFIRM_ATTENDANCE: 'CONFIRM_ATTENDANCE',
  HUMAN_REQUEST: 'HUMAN_REQUEST',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ConversationIntent = typeof CONVERSATION_INTENTS[keyof typeof CONVERSATION_INTENTS];

// Confirmation Response (for morning messages)
export const CONFIRMATION_RESPONSE = {
  YES: 'YES',
  NO: 'NO',
  PENDING: 'PENDING',
  NO_RESPONSE: 'NO_RESPONSE',
} as const;

export type ConfirmationResponse = typeof CONFIRMATION_RESPONSE[keyof typeof CONFIRMATION_RESPONSE];
