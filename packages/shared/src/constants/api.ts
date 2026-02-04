// API related constants
// Error codes, HTTP status, common configurations

// Standard API error codes
export const API_ERROR_CODES = {
  // Authentication errors (401)
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_SUSPENDED: 'SUBSCRIPTION_SUSPENDED',

  // Not found errors (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  FACILITY_NOT_FOUND: 'FACILITY_NOT_FOUND',
  COURT_NOT_FOUND: 'COURT_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_PHONE: 'DUPLICATE_PHONE',
  DUPLICATE_SLUG: 'DUPLICATE_SLUG',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_TIME: 'INVALID_TIME',

  // Booking errors (400/409)
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  SLOT_ALREADY_BOOKED: 'SLOT_ALREADY_BOOKED',
  BOOKING_TOO_SOON: 'BOOKING_TOO_SOON',
  BOOKING_TOO_FAR: 'BOOKING_TOO_FAR',
  OUTSIDE_OPERATING_HOURS: 'OUTSIDE_OPERATING_HOURS',
  COURT_UNAVAILABLE: 'COURT_UNAVAILABLE',
  CANCELLATION_NOT_ALLOWED: 'CANCELLATION_NOT_ALLOWED',
  BOOKING_ALREADY_CANCELLED: 'BOOKING_ALREADY_CANCELLED',
  BOOKING_ALREADY_COMPLETED: 'BOOKING_ALREADY_COMPLETED',

  // Payment errors (400/402)
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  INSUFFICIENT_CREDIT: 'INSUFFICIENT_CREDIT',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',

  // Customer errors (400)
  CUSTOMER_BLOCKED: 'CUSTOMER_BLOCKED',
  POOR_REPUTATION: 'POOR_REPUTATION',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// API error messages (Spanish)
export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  TOKEN_EXPIRED: 'Tu sesión ha expirado',
  TOKEN_INVALID: 'Token de autenticación inválido',
  UNAUTHORIZED: 'No tienes permiso para realizar esta acción',
  FORBIDDEN: 'Acceso denegado',
  INSUFFICIENT_PERMISSIONS: 'No tienes los permisos necesarios',
  TENANT_MISMATCH: 'No tienes acceso a estos datos',
  SUBSCRIPTION_REQUIRED: 'Se requiere una suscripción activa',
  SUBSCRIPTION_SUSPENDED: 'Tu suscripción está suspendida',
  USER_NOT_FOUND: 'Usuario no encontrado',
  TENANT_NOT_FOUND: 'Tenant no encontrado',
  FACILITY_NOT_FOUND: 'Establecimiento no encontrado',
  COURT_NOT_FOUND: 'Cancha no encontrada',
  BOOKING_NOT_FOUND: 'Reserva no encontrada',
  CUSTOMER_NOT_FOUND: 'Cliente no encontrado',
  PAYMENT_NOT_FOUND: 'Pago no encontrado',
  VALIDATION_ERROR: 'Error de validación',
  INVALID_INPUT: 'Datos de entrada inválidos',
  DUPLICATE_EMAIL: 'Este email ya está registrado',
  DUPLICATE_PHONE: 'Este teléfono ya está registrado',
  DUPLICATE_SLUG: 'Este identificador ya está en uso',
  INVALID_DATE: 'Fecha inválida',
  INVALID_TIME: 'Hora inválida',
  SLOT_NOT_AVAILABLE: 'El horario no está disponible',
  SLOT_ALREADY_BOOKED: 'El horario ya está reservado',
  BOOKING_TOO_SOON: 'No se puede reservar con tan poca anticipación',
  BOOKING_TOO_FAR: 'No se puede reservar con tanta anticipación',
  OUTSIDE_OPERATING_HOURS: 'Fuera del horario de atención',
  COURT_UNAVAILABLE: 'La cancha no está disponible',
  CANCELLATION_NOT_ALLOWED: 'No se permite cancelar esta reserva',
  BOOKING_ALREADY_CANCELLED: 'La reserva ya fue cancelada',
  BOOKING_ALREADY_COMPLETED: 'La reserva ya fue completada',
  PAYMENT_FAILED: 'Error en el pago',
  PAYMENT_ALREADY_PROCESSED: 'El pago ya fue procesado',
  INSUFFICIENT_CREDIT: 'Crédito insuficiente',
  INVALID_PAYMENT_METHOD: 'Método de pago inválido',
  CUSTOMER_BLOCKED: 'El cliente está bloqueado',
  POOR_REPUTATION: 'El cliente tiene mala reputación',
  INTERNAL_ERROR: 'Error interno del servidor',
  DATABASE_ERROR: 'Error de base de datos',
  EXTERNAL_SERVICE_ERROR: 'Error en servicio externo',
};

// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// Standard API error response
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
  path: string;
}

// WebSocket event names
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',

  // Booking events
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  BOOKING_STATUS_CHANGED: 'booking:status_changed',
  BOOKING_PAYMENT_RECEIVED: 'booking:payment_received',

  // Payment events
  PAYMENT_CREATED: 'payment:created',
  PAYMENT_UPDATED: 'payment:updated',
  PAYMENT_STATUS_CHANGED: 'payment:status_changed',

  // Slot events (for calendar real-time updates)
  SLOT_LOCKED: 'slot:locked',
  SLOT_UNLOCKED: 'slot:unlocked',

  // Customer events
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',

  // Escalation events
  ESCALATION_CREATED: 'escalation:created',
  ESCALATION_RESOLVED: 'escalation:resolved',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',

  // Takeover events (Phase 7.2)
  TAKEOVER_ACTIVATED: 'takeover:activated',
  TAKEOVER_RESUMED: 'takeover:resumed',
  TAKEOVER_EXTENDED: 'takeover:extended',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
