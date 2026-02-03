// Tenant Status Badge Component
// Displays tenant status with appropriate colors

'use client';

import { cn } from '@/lib/cn';

interface TenantStatusBadgeProps {
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  className?: string;
}

const statusConfig = {
  ACTIVE: {
    label: 'Activo',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    dotColor: 'bg-green-500',
  },
  SUSPENDED: {
    label: 'Suspendido',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    dotColor: 'bg-yellow-500',
  },
  CANCELLED: {
    label: 'Cancelado',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-500',
  },
};

export function TenantStatusBadge({ status, className }: TenantStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
