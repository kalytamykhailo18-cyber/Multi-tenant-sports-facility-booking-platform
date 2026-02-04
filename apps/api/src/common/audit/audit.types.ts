// Audit Log Types and Interfaces
// Defines all event types and structures for traceability logging

// Event categories for different areas of the system
export enum AuditEventCategory {
  // Authentication & Authorization
  AUTH = 'AUTH',

  // WhatsApp messaging
  WHATSAPP = 'WHATSAPP',

  // Booking management
  BOOKING = 'BOOKING',

  // Payment processing
  PAYMENT = 'PAYMENT',

  // Calendar modifications
  CALENDAR = 'CALENDAR',

  // Customer management
  CUSTOMER = 'CUSTOMER',

  // AI/Bot interactions
  AI_BOT = 'AI_BOT',

  // Subscription management
  SUBSCRIPTION = 'SUBSCRIPTION',

  // Tenant management
  TENANT = 'TENANT',

  // Facility management
  FACILITY = 'FACILITY',

  // System events
  SYSTEM = 'SYSTEM',
}

// Specific action types within each category
export enum AuditEventType {
  // Auth events
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_REGISTER = 'AUTH_REGISTER',
  AUTH_PASSWORD_CHANGE = 'AUTH_PASSWORD_CHANGE',
  AUTH_TOKEN_REFRESH = 'AUTH_TOKEN_REFRESH',
  AUTH_FAILED_ATTEMPT = 'AUTH_FAILED_ATTEMPT',

  // WhatsApp events
  WHATSAPP_MESSAGE_RECEIVED = 'WHATSAPP_MESSAGE_RECEIVED',
  WHATSAPP_MESSAGE_SENT = 'WHATSAPP_MESSAGE_SENT',
  WHATSAPP_MESSAGE_FAILED = 'WHATSAPP_MESSAGE_FAILED',
  WHATSAPP_AUDIO_RECEIVED = 'WHATSAPP_AUDIO_RECEIVED',
  WHATSAPP_AUDIO_TRANSCRIBED = 'WHATSAPP_AUDIO_TRANSCRIBED',
  WHATSAPP_AUDIO_FAILED = 'WHATSAPP_AUDIO_FAILED',
  WHATSAPP_STATUS_UPDATE = 'WHATSAPP_STATUS_UPDATE',

  // Booking events
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_NO_SHOW = 'BOOKING_NO_SHOW',
  BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
  BOOKING_STATUS_CHANGED = 'BOOKING_STATUS_CHANGED',
  BOOKING_SLOT_LOCKED = 'BOOKING_SLOT_LOCKED',
  BOOKING_SLOT_RELEASED = 'BOOKING_SLOT_RELEASED',

  // Payment events
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_LINK_CREATED = 'PAYMENT_LINK_CREATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_WEBHOOK_RECEIVED = 'PAYMENT_WEBHOOK_RECEIVED',
  PAYMENT_WEBHOOK_PROCESSED = 'PAYMENT_WEBHOOK_PROCESSED',
  PAYMENT_RECONCILIATION = 'PAYMENT_RECONCILIATION',
  PAYMENT_RECONCILED = 'PAYMENT_RECONCILED',

  // Calendar events (for drag-drop and manual edits)
  CALENDAR_SLOT_MOVED = 'CALENDAR_SLOT_MOVED',
  CALENDAR_SLOT_CREATED = 'CALENDAR_SLOT_CREATED',
  CALENDAR_SLOT_DELETED = 'CALENDAR_SLOT_DELETED',
  CALENDAR_HOURS_UPDATED = 'CALENDAR_HOURS_UPDATED',

  // Customer events
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_BLOCKED = 'CUSTOMER_BLOCKED',
  CUSTOMER_UNBLOCKED = 'CUSTOMER_UNBLOCKED',
  CUSTOMER_REPUTATION_CHANGED = 'CUSTOMER_REPUTATION_CHANGED',
  CUSTOMER_CREDIT_ADDED = 'CUSTOMER_CREDIT_ADDED',
  CUSTOMER_CREDIT_USED = 'CUSTOMER_CREDIT_USED',

  // AI/Bot events
  AI_INTENT_DETECTED = 'AI_INTENT_DETECTED',
  AI_RESPONSE_GENERATED = 'AI_RESPONSE_GENERATED',
  AI_ESCALATION_TRIGGERED = 'AI_ESCALATION_TRIGGERED',
  AI_ESCALATION_RESOLVED = 'AI_ESCALATION_RESOLVED',
  AI_CONFIDENCE_LOW = 'AI_CONFIDENCE_LOW',
  AI_API_FAILURE = 'AI_API_FAILURE',

  // Subscription events
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_SUSPENDED = 'SUBSCRIPTION_SUSPENDED',
  SUBSCRIPTION_REACTIVATED = 'SUBSCRIPTION_REACTIVATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_REMINDER_SENT = 'SUBSCRIPTION_REMINDER_SENT',

  // Tenant events
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_UPDATED = 'TENANT_UPDATED',
  TENANT_DELETED = 'TENANT_DELETED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_REACTIVATED = 'TENANT_REACTIVATED',

  // Facility events
  FACILITY_CREATED = 'FACILITY_CREATED',
  FACILITY_UPDATED = 'FACILITY_UPDATED',
  FACILITY_CREDENTIALS_UPDATED = 'FACILITY_CREDENTIALS_UPDATED',
  FACILITY_STATUS_CHANGED = 'FACILITY_STATUS_CHANGED',
  COURT_CREATED = 'COURT_CREATED',
  COURT_UPDATED = 'COURT_UPDATED',
  COURT_STATUS_CHANGED = 'COURT_STATUS_CHANGED',

  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  JOB_STARTED = 'JOB_STARTED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_FAILED = 'JOB_FAILED',
}

// Log severity levels
export enum AuditSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Main audit log entry interface
export interface AuditLogEntry {
  // Unique identifier for the log entry
  id: string;

  // Event classification
  category: AuditEventCategory;
  eventType: AuditEventType;
  severity: AuditSeverity;

  // Timestamp in ISO format (UTC)
  timestamp: string;

  // Tenant context (null for system-wide events)
  tenantId: string | null;

  // Actor information (who triggered the event)
  actor: {
    type: 'USER' | 'CUSTOMER' | 'SYSTEM' | 'BOT' | 'WEBHOOK';
    id: string | null;
    email?: string;
    role?: string;
    ip?: string;
  };

  // Target entity information
  entity?: {
    type: string; // 'BOOKING', 'PAYMENT', 'CUSTOMER', etc.
    id: string;
  };

  // Action description
  action: string;

  // State changes (for mutations)
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    fields?: string[]; // List of changed field names
  };

  // Additional context data
  metadata?: Record<string, unknown>;

  // Error information (if applicable)
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };

  // Request context (if from HTTP request)
  request?: {
    method: string;
    path: string;
    userAgent?: string;
    ip?: string;
  };
}

// Options for creating audit log entries
export interface CreateAuditLogOptions {
  category: AuditEventCategory;
  eventType: AuditEventType;
  severity?: AuditSeverity;
  tenantId?: string | null;
  actor?: Partial<AuditLogEntry['actor']>;
  entity?: AuditLogEntry['entity'];
  action: string;
  changes?: AuditLogEntry['changes'];
  metadata?: Record<string, unknown>;
  error?: AuditLogEntry['error'];
  request?: AuditLogEntry['request'];
}

// Query options for retrieving audit logs
export interface AuditLogQueryOptions {
  tenantId?: string;
  category?: AuditEventCategory;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorType?: AuditLogEntry['actor']['type'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Audit log with formatted output for display
export interface FormattedAuditLog extends AuditLogEntry {
  formattedTimestamp: string;
  categoryLabel: string;
  eventTypeLabel: string;
  severityColor: string;
}
