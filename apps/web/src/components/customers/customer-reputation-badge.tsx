// Customer Reputation Badge Component
// Displays customer reputation level with color-coded badge

'use client';

import { Badge } from '@/components/ui/badge';
import type { ReputationLevel } from '@/lib/customers-api';

interface CustomerReputationBadgeProps {
  level: ReputationLevel;
  score?: number;
  showScore?: boolean;
}

const reputationConfig: Record<
  ReputationLevel,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  GOOD: {
    label: 'Bueno',
    variant: 'default',
  },
  CAUTION: {
    label: 'Precaución',
    variant: 'secondary',
  },
  POOR: {
    label: 'Malo',
    variant: 'destructive',
  },
};

export function CustomerReputationBadge({
  level,
  score,
  showScore = false,
}: CustomerReputationBadgeProps) {
  const config = reputationConfig[level];

  return (
    <Badge variant={config.variant}>
      {config.label}
      {showScore && score !== undefined && ` (${score})`}
    </Badge>
  );
}
