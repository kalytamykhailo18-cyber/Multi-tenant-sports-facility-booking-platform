// Payment Link Section Component
// Section for booking modal to manage payments and generate payment links

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PaymentStatus } from './payment-status';
import { PaymentStatusBadge } from './payment-status-badge';
import {
  type Payment,
  type PaymentType,
  type PreferenceResponse,
  getPaymentTypeLabel,
  formatPaymentAmount,
  openMercadoPagoCheckout,
  isPaymentFinal,
} from '@/lib/payments-api';
import {
  useBookingPayments,
  useCreatePaymentPreference,
  usePaymentStatusRefresh,
} from '@/hooks/usePayments';
import {
  AiOutlineCreditCard,
  AiOutlineLink,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineCopy,
  AiOutlineQrcode,
} from 'react-icons/ai';

interface PaymentLinkSectionProps {
  bookingId: string;
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
  balancePaid: boolean;
  currencyCode?: string;
  customerEmail?: string;
  customerName?: string;
  /** Callback when payment status changes */
  onPaymentStatusChange?: (payment: Payment) => void;
  /** Use sandbox mode for Mercado Pago */
  useSandbox?: boolean;
}

export function PaymentLinkSection({
  bookingId,
  totalPrice,
  depositAmount,
  depositPaid,
  balancePaid,
  currencyCode = 'ARS',
  customerEmail,
  customerName,
  onPaymentStatusChange,
  useSandbox = false,
}: PaymentLinkSectionProps) {
  // Load payments for this booking
  const { payments, loading: loadingPayments } = useBookingPayments(bookingId);

  // Create payment preference
  const {
    createPreference,
    preference,
    isCreating,
    error: createError,
    clearError,
    clearPreference,
  } = useCreatePaymentPreference();

  // Refresh payment status
  const { refreshStatus, isRefreshing, error: refreshError } = usePaymentStatusRefresh();

  // Local state for selected payment type
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Balance amount
  const balanceAmount = totalPrice - depositAmount;

  // Find existing payments by type
  const depositPayment = payments.find((p) => p.type === 'BOOKING_DEPOSIT');
  const balancePayment = payments.find((p) => p.type === 'BOOKING_BALANCE');

  // Determine what payments can be created
  const canCreateDepositLink = !depositPaid && !depositPayment?.externalPreferenceId;
  const canCreateBalanceLink = depositPaid && !balancePaid && !balancePayment?.externalPreferenceId;

  // Handle create payment link
  const handleCreateLink = useCallback(async (type: PaymentType) => {
    setSelectedType(type);
    clearError();
    try {
      await createPreference(bookingId, type, {
        payerEmail: customerEmail,
        payerName: customerName,
      });
    } catch {
      // Error handled in hook
    }
  }, [bookingId, customerEmail, customerName, createPreference, clearError]);

  // Handle open checkout
  const handleOpenCheckout = useCallback(() => {
    if (preference) {
      openMercadoPagoCheckout(preference, useSandbox);
    }
  }, [preference, useSandbox]);

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    if (preference) {
      const url = useSandbox ? preference.sandboxInitPoint : preference.initPoint;
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {
        console.error('Failed to copy link');
      }
    }
  }, [preference, useSandbox]);

  // Handle refresh payment
  const handleRefreshPayment = useCallback(async (paymentId: string) => {
    try {
      const result = await refreshStatus(paymentId);
      // Notify parent of status change
      if (onPaymentStatusChange && result) {
        const updatedPayment = payments.find((p) => p.id === paymentId);
        if (updatedPayment) {
          onPaymentStatusChange({ ...updatedPayment, status: result.status });
        }
      }
    } catch {
      // Error handled in hook
    }
  }, [refreshStatus, payments, onPaymentStatusChange]);

  // Clear preference when component unmounts or booking changes
  useEffect(() => {
    return () => clearPreference();
  }, [bookingId, clearPreference]);

  if (loadingPayments) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
        <span className="ml-2 text-sm text-muted-foreground">Cargando pagos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Deposit Section */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AiOutlineCreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Seña</span>
          </div>
          {depositPaid ? (
            <div className="flex items-center gap-1 text-green-600">
              <AiOutlineCheckCircle className="w-4 h-4" />
              <span className="text-sm">Pagada</span>
            </div>
          ) : (
            <span className="text-sm text-yellow-600">Pendiente</span>
          )}
        </div>

        <p className="text-lg font-semibold mb-3">
          {formatPaymentAmount(depositAmount, currencyCode)}
        </p>

        {/* Existing deposit payment */}
        {depositPayment && !depositPaid && (
          <div className="mb-3 p-3 bg-muted rounded">
            <PaymentStatus
              payment={depositPayment}
              onRefresh={() => handleRefreshPayment(depositPayment.id)}
              isRefreshing={isRefreshing}
              compact
            />
            {depositPayment.externalPreferenceId && !isPaymentFinal(depositPayment.status) && (
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Open existing link if we have it in preference
                    if (preference && selectedType === 'BOOKING_DEPOSIT') {
                      openMercadoPagoCheckout(preference, useSandbox);
                    }
                  }}
                >
                  <AiOutlineLink className="w-4 h-4 mr-1" />
                  Abrir link
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Create deposit link button */}
        {canCreateDepositLink && !depositPaid && (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleCreateLink('BOOKING_DEPOSIT')}
            disabled={isCreating}
          >
            {isCreating && selectedType === 'BOOKING_DEPOSIT' ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generando link...
              </>
            ) : (
              <>
                <AiOutlineLink className="w-4 h-4 mr-2" />
                Generar link de pago
              </>
            )}
          </Button>
        )}

        {/* Show generated preference for deposit */}
        {preference && selectedType === 'BOOKING_DEPOSIT' && (
          <GeneratedLinkDisplay
            preference={preference}
            useSandbox={useSandbox}
            onOpenCheckout={handleOpenCheckout}
            onCopyLink={handleCopyLink}
            copiedLink={copiedLink}
          />
        )}
      </div>

      {/* Balance Section */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AiOutlineCreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Saldo</span>
          </div>
          {balancePaid ? (
            <div className="flex items-center gap-1 text-green-600">
              <AiOutlineCheckCircle className="w-4 h-4" />
              <span className="text-sm">Pagado</span>
            </div>
          ) : depositPaid ? (
            <span className="text-sm text-yellow-600">Pendiente</span>
          ) : (
            <span className="text-sm text-muted-foreground">Esperando seña</span>
          )}
        </div>

        <p className="text-lg font-semibold mb-3">
          {formatPaymentAmount(balanceAmount, currencyCode)}
        </p>

        {/* Existing balance payment */}
        {balancePayment && !balancePaid && (
          <div className="mb-3 p-3 bg-muted rounded">
            <PaymentStatus
              payment={balancePayment}
              onRefresh={() => handleRefreshPayment(balancePayment.id)}
              isRefreshing={isRefreshing}
              compact
            />
          </div>
        )}

        {/* Create balance link button */}
        {canCreateBalanceLink && (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleCreateLink('BOOKING_BALANCE')}
            disabled={isCreating}
          >
            {isCreating && selectedType === 'BOOKING_BALANCE' ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generando link...
              </>
            ) : (
              <>
                <AiOutlineLink className="w-4 h-4 mr-2" />
                Generar link de pago
              </>
            )}
          </Button>
        )}

        {/* Show generated preference for balance */}
        {preference && selectedType === 'BOOKING_BALANCE' && (
          <GeneratedLinkDisplay
            preference={preference}
            useSandbox={useSandbox}
            onOpenCheckout={handleOpenCheckout}
            onCopyLink={handleCopyLink}
            copiedLink={copiedLink}
          />
        )}

        {/* Show message if deposit not paid yet */}
        {!depositPaid && !balancePaid && (
          <p className="text-sm text-muted-foreground">
            <AiOutlineExclamationCircle className="w-4 h-4 inline mr-1" />
            Primero debe pagarse la seña
          </p>
        )}
      </div>

      {/* Error display */}
      {(createError || refreshError) && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {createError || refreshError}
        </div>
      )}

      {/* All payments list (if any) */}
      {payments.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Historial de pagos
          </p>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
              >
                <div className="flex items-center gap-2">
                  <PaymentStatusBadge status={payment.status} size="sm" />
                  <span>{getPaymentTypeLabel(payment.type)}</span>
                </div>
                <span className="font-medium">
                  {formatPaymentAmount(payment.amount, payment.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for displaying generated link
interface GeneratedLinkDisplayProps {
  preference: PreferenceResponse;
  useSandbox: boolean;
  onOpenCheckout: () => void;
  onCopyLink: () => void;
  copiedLink: boolean;
}

function GeneratedLinkDisplay({
  preference,
  useSandbox,
  onOpenCheckout,
  onCopyLink,
  copiedLink,
}: GeneratedLinkDisplayProps) {
  const url = useSandbox ? preference.sandboxInitPoint : preference.initPoint;

  return (
    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
        <span className="font-medium text-green-800">Link generado</span>
      </div>

      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">Link de pago:</p>
        <p className="text-sm font-mono bg-white p-2 rounded border break-all">
          {url}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onOpenCheckout}
        >
          <AiOutlineQrcode className="w-4 h-4 mr-1" />
          Abrir checkout
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyLink}
        >
          <AiOutlineCopy className="w-4 h-4 mr-1" />
          {copiedLink ? 'Copiado!' : 'Copiar link'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        El link expira el {new Date(preference.expiresAt).toLocaleString('es-AR')}
      </p>
    </div>
  );
}
