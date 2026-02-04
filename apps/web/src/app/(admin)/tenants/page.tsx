// Tenant Management Page
// Super Admin page for managing all tenants

'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { TenantList } from '@/components/tenants/tenant-list';
import type { Tenant } from '@/lib/tenants-api';

export default function TenantsPage() {
  const router = useRouter();

  const handleViewTenant = (tenant: Tenant) => {
    // Navigate to tenant detail page
    router.push(`/tenants/${tenant.id}`);
  };

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gestión de Tenants</h1>
          <p className="text-muted-foreground mt-2">
            Administra todos los negocios registrados en la plataforma
          </p>
        </div>

        {/* Tenant List */}
        <TenantList onViewTenant={handleViewTenant} />
      </div>
    </ProtectedRoute>
  );
}
