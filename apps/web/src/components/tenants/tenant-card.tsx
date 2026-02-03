// Tenant Card Component
// Displays a single tenant with quick actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TenantStatusBadge } from './tenant-status-badge';
import type { Tenant } from '@/lib/tenants-api';

interface TenantCardProps {
  tenant: Tenant;
  onEdit?: (tenant: Tenant) => void;
  onSuspend?: (tenant: Tenant) => void;
  onReactivate?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
  onView?: (tenant: Tenant) => void;
}

export function TenantCard({
  tenant,
  onEdit,
  onSuspend,
  onReactivate,
  onDelete,
  onView,
}: TenantCardProps) {
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
            <CardTitle className="text-lg">{tenant.businessName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              /{tenant.slug}
            </p>
          </div>
          <TenantStatusBadge status={tenant.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-2xl font-semibold">{tenant.facilityCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Instalaciones</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-2xl font-semibold">{tenant.userCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Usuarios</p>
          </div>
        </div>

        {/* Meta info */}
        <p className="text-xs text-muted-foreground mb-4">
          Creado: {formatDate(tenant.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(tenant)}
            >
              Ver
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(tenant)}
            >
              Editar
            </Button>
          )}
          {tenant.status === 'ACTIVE' && onSuspend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuspend(tenant)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              Suspender
            </Button>
          )}
          {tenant.status === 'SUSPENDED' && onReactivate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(tenant)}
              className="text-green-600 hover:text-green-700"
            >
              Reactivar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(tenant)}
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
