// Tenant List Component
// Displays paginated list of tenants with search and filters

'use client';

import { useState, useEffect } from 'react';
import { useTenants } from '@/hooks/useTenants';
import { TenantCard } from './tenant-card';
import { TenantForm } from './tenant-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Tenant, QueryTenantParams } from '@/lib/tenants-api';

interface TenantListProps {
  onViewTenant?: (tenant: Tenant) => void;
}

export function TenantList({ onViewTenant }: TenantListProps) {
  const {
    tenants,
    pagination,
    loading,
    creating,
    updating,
    deleting,
    error,
    loadTenants,
    create,
    update,
    suspend,
    reactivate,
    remove,
    clearError,
  } = useTenants();

  // Local state for filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QueryTenantParams['status']>();
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  // Load tenants on mount and when filters change
  useEffect(() => {
    loadTenants({
      page: currentPage,
      limit: 10,
      search: search || undefined,
      status: statusFilter,
    });
  }, [loadTenants, currentPage, search, statusFilter]);

  // Clear error when search changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusFilterChange = (status: QueryTenantParams['status']) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCreateSubmit = async (data: { businessName: string; slug?: string }) => {
    await create(data);
    setShowCreateModal(false);
  };

  const handleEditSubmit = async (data: { businessName?: string; slug?: string }) => {
    if (editingTenant) {
      await update(editingTenant.id, data);
      setEditingTenant(null);
    }
  };

  const handleSuspend = async (tenant: Tenant) => {
    if (confirm(`¿Estás seguro de suspender "${tenant.businessName}"?`)) {
      await suspend(tenant.id);
    }
  };

  const handleReactivate = async (tenant: Tenant) => {
    if (confirm(`¿Estás seguro de reactivar "${tenant.businessName}"?`)) {
      await reactivate(tenant.id);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (confirm(`¿Estás seguro de eliminar "${tenant.businessName}"? Esta acción puede ser irreversible.`)) {
      await remove(tenant.id);
      setTenantToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-xs"
          />

          {/* Status filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange(undefined)}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('ACTIVE')}
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('SUSPENDED')}
            >
              Suspendidos
            </Button>
          </div>
        </div>

        {/* Create button */}
        <Button onClick={() => setShowCreateModal(true)}>
          Nuevo Tenant
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Tenant grid */}
      {!loading && tenants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onView={onViewTenant}
              onEdit={(t) => setEditingTenant(t)}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && tenants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search || statusFilter
              ? 'No se encontraron tenants con los filtros aplicados'
              : 'No hay tenants registrados'}
          </p>
          {!search && !statusFilter && (
            <Button
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Crear primer tenant
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm">
            Página {currentPage} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <TenantForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={creating}
        />
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <TenantForm
          tenant={editingTenant}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingTenant(null)}
          isSubmitting={updating}
        />
      )}
    </div>
  );
}
