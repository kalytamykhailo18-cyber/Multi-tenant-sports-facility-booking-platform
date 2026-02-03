// Facilities Management Page
// Super Admin page for viewing all facilities

'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { FacilityList } from '@/components/facilities';
import type { Facility } from '@/lib/facilities-api';

export default function FacilitiesPage() {
  const router = useRouter();

  const handleViewFacility = (facility: Facility) => {
    router.push(`/facilities/${facility.id}`);
  };

  const handleManageCredentials = (facility: Facility) => {
    router.push(`/facilities/${facility.id}/credentials`);
  };

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gestión de Instalaciones</h1>
          <p className="text-muted-foreground mt-2">
            Administra todas las instalaciones de la plataforma
          </p>
        </div>

        {/* Facility List - no tenantId means show all (for Super Admin) */}
        <FacilityList
          onViewFacility={handleViewFacility}
          onManageCredentials={handleManageCredentials}
        />
      </div>
    </ProtectedRoute>
  );
}
