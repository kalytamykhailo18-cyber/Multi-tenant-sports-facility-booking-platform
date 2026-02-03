// Court Status Badge Component
// Displays court status with appropriate styling

'use client';

import { Badge } from '@/components/ui/badge';
import { type CourtStatus, getCourtStatusLabel, getCourtStatusVariant } from '@/lib/courts-api';

interface CourtStatusBadgeProps {
  status: CourtStatus;
  className?: string;
}

export function CourtStatusBadge({ status, className }: CourtStatusBadgeProps) {
  return (
    <Badge variant={getCourtStatusVariant(status)} className={className}>
      {getCourtStatusLabel(status)}
    </Badge>
  );
}
