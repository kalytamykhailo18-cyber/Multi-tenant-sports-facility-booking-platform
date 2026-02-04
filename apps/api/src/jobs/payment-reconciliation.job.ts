// Payment Reconciliation Job
// Actual implementation is in modules/payments/jobs/payment-reconciliation.job.ts
// This file is kept for documentation and backward compatibility

// The payment reconciliation job:
// - Runs hourly to catch missed webhooks
// - Proactively checks pending payments every 5 minutes
// - Reconciles payment status with Mercado Pago
// - Updates bookings when payments are confirmed
// - Alerts on stale payments

export { PaymentReconciliationJob } from '../modules/payments/jobs/payment-reconciliation.job';
