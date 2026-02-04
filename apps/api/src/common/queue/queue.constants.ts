// Queue Constants
// Defines queue names used throughout the application

export const QUEUE_NAMES = {
  // Payment processing queue
  PAYMENT_WEBHOOK: 'payment-webhook',

  // WhatsApp outgoing messages queue
  OUTGOING_WHATSAPP: 'outgoing-whatsapp',

  // Future queues can be added here
  // NOTIFICATION: 'notification',
  // EMAIL: 'email',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
