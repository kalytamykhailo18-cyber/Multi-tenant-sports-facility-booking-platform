// Notification related constants
// Used for morning messages, reminders, alerts

// Notification Types
export const NOTIFICATION_TYPE = {
  // Morning messages
  MORNING_CONFIRMATION: 'MORNING_CONFIRMATION',
  MORNING_FOLLOWUP: 'MORNING_FOLLOWUP',

  // Booking notifications
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_REMINDER: 'BOOKING_REMINDER',

  // Payment notifications
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',

  // Waiting list
  WAITLIST_SLOT_AVAILABLE: 'WAITLIST_SLOT_AVAILABLE',
  WAITLIST_TIMEOUT: 'WAITLIST_TIMEOUT',

  // Subscription
  SUBSCRIPTION_DUE_SOON: 'SUBSCRIPTION_DUE_SOON',
  SUBSCRIPTION_SUSPENDED: 'SUBSCRIPTION_SUSPENDED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',

  // Escalation
  ESCALATION_NEW: 'ESCALATION_NEW',
  ESCALATION_RESOLVED: 'ESCALATION_RESOLVED',

  // Weather/Emergency
  WEATHER_ALERT: 'WEATHER_ALERT',
  EMERGENCY_ALERT: 'EMERGENCY_ALERT',
  COURT_MAINTENANCE: 'COURT_MAINTENANCE',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

// Notification Type Labels (Spanish)
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  MORNING_CONFIRMATION: 'Confirmación matutina',
  MORNING_FOLLOWUP: 'Seguimiento matutino',
  BOOKING_CREATED: 'Reserva creada',
  BOOKING_CONFIRMED: 'Reserva confirmada',
  BOOKING_CANCELLED: 'Reserva cancelada',
  BOOKING_REMINDER: 'Recordatorio de reserva',
  PAYMENT_RECEIVED: 'Pago recibido',
  PAYMENT_FAILED: 'Pago fallido',
  PAYMENT_REFUNDED: 'Pago reembolsado',
  WAITLIST_SLOT_AVAILABLE: 'Turno disponible',
  WAITLIST_TIMEOUT: 'Tiempo de espera agotado',
  SUBSCRIPTION_DUE_SOON: 'Suscripción próxima a vencer',
  SUBSCRIPTION_SUSPENDED: 'Suscripción suspendida',
  SUBSCRIPTION_RENEWED: 'Suscripción renovada',
  ESCALATION_NEW: 'Nueva escalación',
  ESCALATION_RESOLVED: 'Escalación resuelta',
  WEATHER_ALERT: 'Alerta de clima',
  EMERGENCY_ALERT: 'Alerta de emergencia',
  COURT_MAINTENANCE: 'Mantenimiento de cancha',
};

// Default timing configurations
export const NOTIFICATION_TIMING = {
  // Morning message time (hour in 24h format)
  MORNING_MESSAGE_HOUR: 9,

  // Follow-up if no response (hours after morning message, or hours before booking)
  FOLLOWUP_HOURS_AFTER_MORNING: 5,
  FOLLOWUP_MIN_HOURS_BEFORE_BOOKING: 5,

  // Default follow-up time (hour in 24h format)
  DEFAULT_FOLLOWUP_HOUR: 14,

  // Waiting list response timeout (minutes)
  WAITLIST_RESPONSE_TIMEOUT_MINUTES: 15,

  // Waiting list auto-notify threshold (hours before booking)
  WAITLIST_AUTO_NOTIFY_MIN_HOURS: 2,

  // Booking reminders (hours before)
  REMINDER_24H: 24,
  REMINDER_2H: 2,

  // Subscription due reminder (days before)
  SUBSCRIPTION_REMINDER_DAYS: [5, 3] as const,
} as const;

// Cancellation rules
export const CANCELLATION_RULES = {
  // Hours before booking for full credit refund
  FULL_CREDIT_HOURS: 24,

  // Hours before booking where waiting list is auto-notified
  WAITLIST_AUTO_NOTIFY_HOURS: 2,

  // Default deposit percentage
  DEFAULT_DEPOSIT_PERCENTAGE: 50,
} as const;

// Slot locking configuration
export const SLOT_LOCK_CONFIG = {
  // How long a slot is locked during payment (minutes)
  LOCK_DURATION_MINUTES: 5,

  // Redis key prefix for slot locks
  LOCK_KEY_PREFIX: 'lock:slot:',
} as const;

// Message templates (Spanish - Rioplatense)
export const MESSAGE_TEMPLATES = {
  MORNING_CONFIRMATION:
    '¡Hola {name}! Te recordamos que hoy tenés cancha a las {time}. ¿Venís? Respondé SI o NO.',

  MORNING_CONFIRMED:
    '¡Perfecto! Te esperamos a las {time} en {facility}.',

  MORNING_FOLLOWUP:
    'Hola {name}, no recibimos tu confirmación para hoy a las {time}. ¿Podés confirmar si venís?',

  BOOKING_CREATED:
    '¡Tu reserva fue creada! {court} el {date} a las {time}. Total: {total}. Seña: {deposit}.',

  BOOKING_CONFIRMED:
    '¡Reserva confirmada! Te esperamos el {date} a las {time} en {court}.',

  BOOKING_CANCELLED:
    'Tu reserva del {date} a las {time} fue cancelada. {creditInfo}',

  BOOKING_CANCELLED_CREDIT:
    'Se generó un crédito de {amount} a tu favor.',

  BOOKING_CANCELLED_NO_CREDIT:
    'La seña no fue reembolsada por cancelación tardía.',

  PAYMENT_LINK:
    'Para confirmar tu reserva, realizá el pago de la seña ({amount}) en este link: {link}',

  PAYMENT_RECEIVED:
    '¡Pago recibido! Tu reserva quedó confirmada para el {date} a las {time}.',

  WAITLIST_AVAILABLE:
    '¡Se liberó el turno que esperabas! {court} el {date} a las {time}. ' +
    'Tenés {minutes} minutos para confirmar. ¿Lo querés? Respondé SI.',

  WAITLIST_TIMEOUT:
    'El turno fue ofrecido a otra persona. Te avisamos si hay otra disponibilidad.',

  SLOT_BEING_RESERVED:
    'Este horario está siendo reservado por otra persona. Intentá de nuevo en unos minutos.',

  AI_FALLBACK:
    'Estamos teniendo dificultades técnicas. Por favor llamanos al {phone} o intentá de nuevo en unos minutos.',

  ESCALATION_CONNECTING:
    'Te estoy conectando con alguien del equipo. En breve te responden.',

  WEATHER_ALERT:
    'Se pronostica {weather} para tu reserva del {date}. ¿Querés reprogramar?',

  COURT_MAINTENANCE:
    'Hola {name}, lamentablemente la {court} no está disponible para tu reserva del {date} a las {time} ' +
    'por {reason}. ¿Te reprogramamos para otro día u otra cancha?',
} as const;
