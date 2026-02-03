// Payment related types
// These will be expanded when we implement the Payment model

import type { PaymentStatus, SubscriptionStatus } from '../constants';
import type { CurrencyCode } from '../utils/currency.utils';

// Payment preference for Mercado Pago
export interface PaymentPreference {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  expiresAt?: string;
}

// Payment status response
export interface PaymentStatusResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
  paymentMethod?: string;
}

// Credit balance for customer
export interface CustomerCredit {
  id: string;
  customerId: string;
  amount: number;
  remainingAmount: number;
  reason: CreditReason;
  createdAt: string;
  expiresAt?: string;
}

// Credit reason types
export type CreditReason = 'CANCELLATION' | 'REFUND' | 'MANUAL' | 'PAYMENT_ERROR';

// Credit reason labels
export const CREDIT_REASON_LABELS: Record<CreditReason, string> = {
  CANCELLATION: 'Cancelación',
  REFUND: 'Reembolso',
  MANUAL: 'Ajuste manual',
  PAYMENT_ERROR: 'Error de pago',
};

// Subscription details
// Note: No grace period (suspension is IMMEDIATE on due date)
// Note: No autoRenew field (system uses IPN-triggered renewal for 30 days)
export interface SubscriptionDetails {
  id: string;
  tenantId: string;
  planName: string;
  priceAmount: number;
  currency: CurrencyCode;
  billingCycle: 'MONTHLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: SubscriptionStatus;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  dueReminderDays: 3 | 5; // Configurable: show reminder 3 or 5 days before due
}

// Payment type for booking payments
export type PaymentType = 'BOOKING_DEPOSIT' | 'BOOKING_BALANCE' | 'SUBSCRIPTION';

// Payment type labels
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  BOOKING_DEPOSIT: 'Seña de reserva',
  BOOKING_BALANCE: 'Saldo de reserva',
  SUBSCRIPTION: 'Suscripción',
};

// Payment method types
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'TRANSFER' | 'CREDIT';

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'Tarjeta de crédito',
  DEBIT_CARD: 'Tarjeta de débito',
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CREDIT: 'Crédito a favor',
};
