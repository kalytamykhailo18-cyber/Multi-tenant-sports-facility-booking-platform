// Facility Card Component
// Displays a single facility with quick actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FacilityStatusBadge } from './facility-status-badge';
import { CredentialsStatusDisplay } from './credentials-status';
import type { Facility } from '@/lib/facilities-api';

interface FacilityCardProps {
  facility: Facility;
  onEdit?: (facility: Facility) => void;
  onDelete?: (facility: Facility) => void;
  onView?: (facility: Facility) => void;
  onManageCredentials?: (facility: Facility) => void;
}

export function FacilityCard({
  facility,
  onEdit,
  onDelete,
  onView,
  onManageCredentials,
}: FacilityCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{facility.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {facility.city}, {facility.country}
            </p>
          </div>
          <FacilityStatusBadge status={facility.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Address */}
        <p className="text-sm text-muted-foreground mb-3">
          {facility.address}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-2xl font-semibold">{facility.courtCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Canchas</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-2xl font-semibold">{facility.depositPercentage}%</p>
            <p className="text-xs text-muted-foreground">Seña</p>
          </div>
        </div>

        {/* Credentials status */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2">Integraciones:</p>
          <CredentialsStatusDisplay credentials={facility.credentials} />
        </div>

        {/* Meta info */}
        <p className="text-xs text-muted-foreground mb-4">
          Creada: {formatDate(facility.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(facility)}
            >
              Ver
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(facility)}
            >
              Editar
            </Button>
          )}
          {onManageCredentials && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageCredentials(facility)}
            >
              Credenciales
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(facility)}
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
