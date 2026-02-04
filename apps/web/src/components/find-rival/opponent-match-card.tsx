// Opponent Match Card Component
// Displays a match request in card format

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpponentMatch } from '@/lib/opponent-match-api';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUsers,
  FiMapPin,
  FiTrendingUp,
} from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface OpponentMatchCardProps {
  match: OpponentMatch;
  onViewDetails: () => void;
  className?: string;
}

export function OpponentMatchCard({
  match,
  onViewDetails,
  className,
}: OpponentMatchCardProps) {
  const sportTypeLabels = {
    SOCCER: 'Fútbol',
    PADEL: 'Padel',
    TENNIS: 'Tenis',
    MULTI: 'Multi',
  };

  const skillLevelLabels = {
    BEGINNER: 'Principiante',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
    ANY: 'Cualquier nivel',
  };

  const sportType = sportTypeLabels[match.sportType] || match.sportType;
  const skillLevel = skillLevelLabels[match.skillLevel] || match.skillLevel;

  const isAlmostFull = match.spotsRemaining <= 2 && match.spotsRemaining > 0;
  const isFull = match.spotsRemaining === 0;

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{sportType}</CardTitle>
          <Badge variant={isFull ? 'secondary' : 'default'}>
            {match.status === 'OPEN' ? 'Abierto' : 'Completo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FiCalendar className="w-4 h-4 text-muted-foreground" />
            <span>{new Date(match.requestedDate).toLocaleDateString('es-AR')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FiClock className="w-4 h-4 text-muted-foreground" />
            <span>{match.requestedTime} hs</span>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 text-sm">
          <FiUser className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{match.customerName}</span>
        </div>

        {/* Court (if specified) */}
        {match.courtName && (
          <div className="flex items-center gap-2 text-sm">
            <FiMapPin className="w-4 h-4 text-muted-foreground" />
            <span>{match.courtName}</span>
          </div>
        )}

        {/* Skill Level */}
        <div className="flex items-center gap-2 text-sm">
          <FiTrendingUp className="w-4 h-4 text-muted-foreground" />
          <span>{skillLevel}</span>
        </div>

        {/* Players Needed */}
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUsers className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {match.currentPlayers} / {match.playersNeeded}
              </span>
            </div>
            {match.spotsRemaining > 0 && (
              <span
                className={cn(
                  'text-sm font-medium',
                  isAlmostFull ? 'text-orange-600' : 'text-green-600'
                )}
              >
                {match.spotsRemaining === 1
                  ? '1 lugar disponible'
                  : `${match.spotsRemaining} lugares disponibles`}
              </span>
            )}
          </div>
        </div>

        {/* Notes (if any) */}
        {match.notes && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {match.notes}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={onViewDetails}
          variant={isFull ? 'outline' : 'default'}
          className="w-full rounded-md"
        >
          {isFull ? 'Ver Detalles' : 'Unirse'}
        </Button>
      </CardContent>
    </Card>
  );
}
