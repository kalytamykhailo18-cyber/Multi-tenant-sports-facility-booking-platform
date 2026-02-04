// Customer Blocked Badge Component
// Displays blocked status indicator

'use client';

import { Badge } from '@/components/ui/badge';

interface CustomerBlockedBadgeProps {
  isBlocked: boolean;
}

export function CustomerBlockedBadge({ isBlocked }: CustomerBlockedBadgeProps) {
  if (!isBlocked) {
    return null;
  }

  return <Badge variant="destructive">Bloqueado</Badge>;
}
