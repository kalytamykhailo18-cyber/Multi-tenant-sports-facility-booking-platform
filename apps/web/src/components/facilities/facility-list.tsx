// Facility List Component
// Displays paginated list of facilities with search and filters

'use client';

import { useState, useEffect } from 'react';
import { useFacilities } from '@/hooks/useFacilities';
import { FacilityCard } from './facility-card';
import { FacilityForm } from './facility-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Facility, QueryFacilityParams, CreateFacilityRequest, UpdateFacilityRequest } from '@/lib/facilities-api';

interface FacilityListProps {
  tenantId?: string;
  onViewFacility?: (facility: Facility) => void;
  onManageCredentials?: (facility: Facility) => void;
}

export function FacilityList({ tenantId, onViewFacility, onManageCredentials }: FacilityListProps) {
  const {
    facilities,
    pagination,
    loading,
    creating,
    updating,
    deleting,
    error,
    loadFacilities,
    create,
    update,
    remove,
    clearError,
  } = useFacilities();

  // Local state for filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QueryFacilityParams['status']>();
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // Load facilities on mount and when filters change
  useEffect(() => {
    loadFacilities({
      page: currentPage,
      limit: 10,
      search: search || undefined,
      status: statusFilter,
      tenantId,
    });
  }, [loadFacilities, currentPage, search, statusFilter, tenantId]);

  // Clear error when search changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: QueryFacilityParams['status']) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCreateSubmit = async (data: CreateFacilityRequest | UpdateFacilityRequest) => {
    await create(data as CreateFacilityRequest);
    setShowCreateModal(false);
  };

  const handleEditSubmit = async (data: CreateFacilityRequest | UpdateFacilityRequest) => {
    if (editingFacility) {
      await update(editingFacility.id, data as UpdateFacilityRequest);
      setEditingFacility(null);
    }
  };

  const handleDelete = async (facility: Facility) => {
    if (confirm(`¿Estás seguro de eliminar "${facility.name}"? Esta acción puede ser irreversible.`)) {
      await remove(facility.id);
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
            placeholder="Buscar por nombre o ciudad..."
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
              Todas
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('ACTIVE')}
            >
              Activas
            </Button>
            <Button
              variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('SUSPENDED')}
            >
              Suspendidas
            </Button>
            <Button
              variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('INACTIVE')}
            >
              Inactivas
            </Button>
          </div>
        </div>

        {/* Create button */}
        {tenantId && (
          <Button onClick={() => setShowCreateModal(true)}>
            Nueva Instalación
          </Button>
        )}
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

      {/* Facility grid */}
      {!loading && facilities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onView={onViewFacility}
              onEdit={(f) => setEditingFacility(f)}
              onDelete={handleDelete}
              onManageCredentials={onManageCredentials}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && facilities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search || statusFilter
              ? 'No se encontraron instalaciones con los filtros aplicados'
              : 'No hay instalaciones registradas'}
          </p>
          {!search && !statusFilter && tenantId && (
            <Button
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Crear primera instalación
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
      {showCreateModal && tenantId && (
        <FacilityForm
          tenantId={tenantId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={creating}
        />
      )}

      {/* Edit Modal */}
      {editingFacility && (
        <FacilityForm
          facility={editingFacility}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingFacility(null)}
          isSubmitting={updating}
        />
      )}
    </div>
  );
}
