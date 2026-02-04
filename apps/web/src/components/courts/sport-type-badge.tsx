// Sport Type Badge Component
// Displays sport type with icon and label

'use client';

import { Badge } from '@/components/ui/badge';
import { type SportType, getSportTypeLabel, getSportTypeIconName } from '@/lib/courts-api';
import { MdSportsSoccer, MdSportsTennis } from 'react-icons/md';
import { GiTennisCourt } from 'react-icons/gi';
import { BiFootball } from 'react-icons/bi';

// Sport icon component
function SportIcon({ sportType, className }: { sportType: SportType; className?: string }) {
  const iconName = getSportTypeIconName(sportType);
  switch (iconName) {
    case 'soccer':
      return <MdSportsSoccer className={className} />;
    case 'padel':
      return <GiTennisCourt className={className} />;
    case 'tennis':
      return <MdSportsTennis className={className} />;
    case 'multi':
    default:
      return <BiFootball className={className} />;
  }
}

interface SportTypeBadgeProps {
  sportType: SportType;
  showIcon?: boolean;
  className?: string;
}

export function SportTypeBadge({ sportType, showIcon = true, className }: SportTypeBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      {showIcon && <SportIcon sportType={sportType} className="mr-1" />}
      {getSportTypeLabel(sportType)}
    </Badge>
  );
}
