// Mercado Pago Configuration
// Configuration for Mercado Pago payment integration

import { registerAs } from '@nestjs/config';

export const mercadopagoConfig = registerAs('mercadopago', () => ({
  // Default platform credentials (for subscription payments)
  // These are used when facility doesn't have their own credentials
  defaultPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
  defaultAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',

  // Webhook configuration
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',

  // API endpoints
  apiBaseUrl: process.env.MERCADOPAGO_API_URL || 'https://api.mercadopago.com',

  // Sandbox mode (use TEST credentials)
  isSandbox: process.env.NODE_ENV !== 'production',

  // Payment preferences
  defaultCurrency: 'ARS',
  expirationMinutes: parseInt(process.env.MERCADOPAGO_EXPIRATION_MINUTES || '30', 10),

  // Success/Failure URLs (will be customized per facility)
  defaultSuccessUrl: process.env.FRONTEND_URL + '/payment/success',
  defaultFailureUrl: process.env.FRONTEND_URL + '/payment/failure',
  defaultPendingUrl: process.env.FRONTEND_URL + '/payment/pending',

  // Webhook URL
  webhookUrl: process.env.API_URL
    ? `${process.env.API_URL}/api/v1/webhooks/mercadopago`
    : 'http://localhost:3001/api/v1/webhooks/mercadopago',
}));

export type MercadoPagoConfig = ReturnType<typeof mercadopagoConfig>;
