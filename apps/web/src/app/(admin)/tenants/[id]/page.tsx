// Tenant Detail Page
// Shows tenant information and their facilities

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TenantStatusBadge } from '@/components/tenants/tenant-status-badge';
import { FacilityList } from '@/components/facilities/facility-list';
import { useTenants } from '@/hooks/useTenants';
import type { Facility } from '@/lib/facilities-api';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const {
    selectedTenant,
    loadTenantById,
    loadingTenant,
    error,
  } = useTenants();

  useEffect(() => {
    if (tenantId) {
      loadTenantById(tenantId);
    }
  }, [tenantId, loadTenantById]);

  const handleViewFacility = (facility: Facility) => {
    router.push(`/facilities/${facility.id}`);
  };

  const handleManageCredentials = (facility: Facility) => {
    router.push(`/facilities/${facility.id}/credentials`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Back button */}
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => router.push('/tenants')}
        >
          Volver a Tenants
        </Button>

        {/* Loading state */}
        {loadingTenant && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Tenant info */}
        {selectedTenant && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedTenant.businessName}</CardTitle>
                    <p className="text-muted-foreground mt-1">/{selectedTenant.slug}</p>
                  </div>
                  <TenantStatusBadge status={selectedTenant.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 bg-muted rounded-md">
                    <p className="text-3xl font-semibold">{selectedTenant.facilityCount ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Instalaciones</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-md">
                    <p className="text-3xl font-semibold">{selectedTenant.userCount ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Usuarios</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-md">
                    <p className="text-3xl font-semibold">
                      {selectedTenant.hasActiveSubscription ? 'Si' : 'No'}
                    </p>
                    <p className="text-sm text-muted-foreground">Suscripción</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-md">
                    <p className="text-lg font-semibold">{formatDate(selectedTenant.createdAt.toString())}</p>
                    <p className="text-sm text-muted-foreground">Creado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facilities section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Instalaciones del Tenant</h2>
              <FacilityList
                tenantId={tenantId}
                onViewFacility={handleViewFacility}
                onManageCredentials={handleManageCredentials}
              />
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
