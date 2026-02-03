// Court Card Component
// Displays a single court with quick actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CourtStatusBadge } from './court-status-badge';
import { SportTypeBadge } from './sport-type-badge';
import type { Court } from '@/lib/courts-api';

interface CourtCardProps {
  court: Court;
  onEdit?: (court: Court) => void;
  onDelete?: (court: Court) => void;
  onStatusChange?: (court: Court) => void;
}

export function CourtCard({
  court,
  onEdit,
  onDelete,
  onStatusChange,
}: CourtCardProps) {
  const formatPrice = (price: number, currency?: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{court.name}</CardTitle>
            <SportTypeBadge sportType={court.sportType} />
          </div>
          <CourtStatusBadge status={court.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Description */}
        {court.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {court.description}
          </p>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xl font-semibold">
              {formatPrice(court.basePricePerHour, court.currencyCode)}
            </p>
            <p className="text-xs text-muted-foreground">por hora</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xl font-semibold">
              {court.isIndoor ? 'Techada' : 'Descubierta'}
            </p>
            <p className="text-xs text-muted-foreground">Tipo</p>
          </div>
        </div>

        {/* Surface Type */}
        {court.surfaceType && (
          <p className="text-xs text-muted-foreground mb-3">
            Superficie: {court.surfaceType}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(court)}
            >
              Editar
            </Button>
          )}
          {onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(court)}
            >
              Cambiar Estado
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(court)}
              className="text-destructive hover:text-destructive"
            >
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
