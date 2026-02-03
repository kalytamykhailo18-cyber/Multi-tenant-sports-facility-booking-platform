// Facility Status Badge Component
// Displays facility status with color-coded badge

'use client';

import { Badge } from '@/components/ui/badge';

type FacilityStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

interface FacilityStatusBadgeProps {
  status: FacilityStatus;
}

const statusConfig: Record<FacilityStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: {
    label: 'Activa',
    variant: 'default',
  },
  SUSPENDED: {
    label: 'Suspendida',
    variant: 'secondary',
  },
  INACTIVE: {
    label: 'Inactiva',
    variant: 'destructive',
  },
};

export function FacilityStatusBadge({ status }: FacilityStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
