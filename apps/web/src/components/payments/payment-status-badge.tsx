// Payment Status Badge Component
// Displays payment status with color-coded badge

'use client';

import { Badge } from '@/components/ui/badge';
import type { PaymentStatus } from '@/lib/payments-api';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'default';
}

const statusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: {
    label: 'Pendiente',
    variant: 'outline',
  },
  PROCESSING: {
    label: 'Procesando',
    variant: 'secondary',
  },
  COMPLETED: {
    label: 'Completado',
    variant: 'default',
  },
  FAILED: {
    label: 'Fallido',
    variant: 'destructive',
  },
  REFUNDED: {
    label: 'Reembolsado',
    variant: 'outline',
  },
  CANCELLED: {
    label: 'Cancelado',
    variant: 'destructive',
  },
};

export function PaymentStatusBadge({ status, size = 'default' }: PaymentStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0' : '';

  return (
    <Badge variant={config.variant} className={sizeClass}>
      {config.label}
    </Badge>
  );
}
