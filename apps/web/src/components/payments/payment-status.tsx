// Payment Status Component
// Displays payment status with visual indicators

'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PaymentStatusBadge } from './payment-status-badge';
import {
  type Payment,
  type PaymentStatus as PaymentStatusType,
  getPaymentTypeLabel,
  formatPaymentAmount,
  isPaymentFinal,
} from '@/lib/payments-api';
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
  AiOutlineSync,
  AiOutlineExclamationCircle,
} from 'react-icons/ai';

interface PaymentStatusProps {
  payment: Payment;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

const statusIcons: Record<PaymentStatusType, React.ReactNode> = {
  PENDING: <AiOutlineClockCircle className="text-yellow-500 w-5 h-5" />,
  PROCESSING: <AiOutlineSync className="text-blue-500 w-5 h-5 animate-spin" />,
  COMPLETED: <AiOutlineCheckCircle className="text-green-500 w-5 h-5" />,
  FAILED: <AiOutlineCloseCircle className="text-red-500 w-5 h-5" />,
  REFUNDED: <AiOutlineExclamationCircle className="text-gray-500 w-5 h-5" />,
  CANCELLED: <AiOutlineCloseCircle className="text-red-500 w-5 h-5" />,
};

export function PaymentStatus({
  payment,
  onRefresh,
  isRefreshing = false,
  showDetails = true,
  compact = false,
}: PaymentStatusProps) {
  const canRefresh = !isPaymentFinal(payment.status) && onRefresh;

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {statusIcons[payment.status]}
        <PaymentStatusBadge status={payment.status} size="sm" />
        {canRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            {isRefreshing ? (
              <Spinner className="w-3 h-3" />
            ) : (
              <AiOutlineSync className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[payment.status]}
          <PaymentStatusBadge status={payment.status} />
        </div>
        {canRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Actualizando...
              </>
            ) : (
              <>
                <AiOutlineSync className="w-4 h-4 mr-2" />
                Actualizar
              </>
            )}
          </Button>
        )}
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Tipo:</span>
            <p className="font-medium">{getPaymentTypeLabel(payment.type)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Monto:</span>
            <p className="font-medium">{formatPaymentAmount(payment.amount, payment.currency)}</p>
          </div>
          {payment.paymentMethod && (
            <div>
              <span className="text-muted-foreground">Método:</span>
              <p className="font-medium">{payment.paymentMethod}</p>
            </div>
          )}
          {payment.processedAt && (
            <div>
              <span className="text-muted-foreground">Procesado:</span>
              <p className="font-medium">
                {new Date(payment.processedAt).toLocaleString('es-AR')}
              </p>
            </div>
          )}
          {payment.errorMessage && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Error:</span>
              <p className="font-medium text-destructive">{payment.errorMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
