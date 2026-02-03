// Sport Type Badge Component
// Displays sport type with icon and label

'use client';

import { Badge } from '@/components/ui/badge';
import { type SportType, getSportTypeLabel, getSportTypeIcon } from '@/lib/courts-api';

interface SportTypeBadgeProps {
  sportType: SportType;
  showIcon?: boolean;
  className?: string;
}

export function SportTypeBadge({ sportType, showIcon = true, className }: SportTypeBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      {showIcon && <span className="mr-1">{getSportTypeIcon(sportType)}</span>}
      {getSportTypeLabel(sportType)}
    </Badge>
  );
}
