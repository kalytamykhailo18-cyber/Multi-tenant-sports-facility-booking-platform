// Subscription Status Badge Component
// Displays subscription status with color-coded badge

'use client';

import { Badge } from '@/components/ui/badge';
import type { SubscriptionStatus } from '@/lib/subscriptions-api';

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
}

const statusConfig: Record<SubscriptionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: {
    label: 'Activa',
    variant: 'default',
  },
  DUE_SOON: {
    label: 'Por vencer',
    variant: 'outline',
  },
  OVERDUE: {
    label: 'Vencida',
    variant: 'secondary',
  },
  SUSPENDED: {
    label: 'Suspendida',
    variant: 'destructive',
  },
  CANCELLED: {
    label: 'Cancelada',
    variant: 'destructive',
  },
};

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
