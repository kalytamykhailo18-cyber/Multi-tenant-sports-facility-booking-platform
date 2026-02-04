// Courts Management Page
// Manage facility courts (fields/courts) with CRUD operations

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourts } from '@/hooks/useCourts';
import { useUserFacility } from '@/hooks/useFacilities';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourtList, CourtTable } from '@/components/courts/court-list';
import { CourtForm } from '@/components/courts/court-form';
import type { Court, CourtStatus } from '@/lib/courts-api';
import { MdAdd, MdViewModule, MdTableRows } from 'react-icons/md';

type ViewMode = 'grid' | 'table';

export default function CourtsPage() {
  const { user } = useAuth();
  const { selectedFacility, loadUserFacility, loading: loadingFacility } = useUserFacility();
  const {
    courts,
    loading,
    creating,
    updating,
    deleting,
    error,
    loadCourts,
    loadCourtsByFacility,
    create,
    update,
    updateStatus,
    remove,
    setSelectedCourt,
    selectedCourt,
    clearError,
  } = useCourts();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<CourtStatus | 'ALL'>('ALL');
  const [sportFilter, setSportFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<Court | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [courtToChangeStatus, setCourtToChangeStatus] = useState<Court | null>(null);
  const [newStatus, setNewStatus] = useState<CourtStatus>('ACTIVE');

  // Load user's facility on mount
  useEffect(() => {
    if (user?.tenantId) {
      loadUserFacility();
    }
  }, [user?.tenantId, loadUserFacility]);

  // Load courts when facility is loaded
  useEffect(() => {
    if (selectedFacility?.id) {
      loadCourtsByFacility(selectedFacility.id);
    }
  }, [selectedFacility?.id, loadCourtsByFacility]);

  // Filter courts based on selected filters
  const filteredCourts = courts.filter((court) => {
    if (statusFilter !== 'ALL' && court.status !== statusFilter) return false;
    if (sportFilter !== 'ALL' && court.sportType !== sportFilter) return false;
    return true;
  });

  // Handle create court
  const handleCreateClick = () => {
    setSelectedCourt(null);
    setIsFormOpen(true);
  };

  // Handle edit court
  const handleEditClick = (court: Court) => {
    setSelectedCourt(court);
    setIsFormOpen(true);
  };

  // Handle delete court (show confirmation)
  const handleDeleteClick = (court: Court) => {
    setCourtToDelete(court);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!courtToDelete) return;

    await remove(courtToDelete.id);
    setIsDeleteModalOpen(false);
    setCourtToDelete(null);

    // Reload courts after deletion
    if (selectedFacility?.id) {
      loadCourtsByFacility(selectedFacility?.id);
    }
  };

  // Handle status change (show modal)
  const handleStatusChangeClick = (court: Court) => {
    setCourtToChangeStatus(court);
    setNewStatus(court.status);
    setIsStatusModalOpen(true);
  };

  // Confirm status change
  const handleConfirmStatusChange = async () => {
    if (!courtToChangeStatus) return;

    await updateStatus(courtToChangeStatus.id, newStatus);
    setIsStatusModalOpen(false);
    setCourtToChangeStatus(null);

    // Reload courts after status change
    if (selectedFacility?.id) {
      loadCourtsByFacility(selectedFacility?.id);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedCourt) {
        await update(selectedCourt.id, data);
      } else {
        await create({ ...data, facilityId: selectedFacility?.id! });
      }
      setIsFormOpen(false);
      setSelectedCourt(null);

      // Reload courts after creation/update
      if (selectedFacility?.id) {
        loadCourtsByFacility(selectedFacility?.id);
      }
    } catch (error) {
      // Error is handled by store
    }
  };

  return (
    <ProtectedRoute requiredRoles={['OWNER', 'STAFF']}>
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Cerrar
            </Button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Canchas</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las canchas de tu instalación
            </p>
          </div>
          <Button onClick={handleCreateClick} size="lg">
            <MdAdd className="mr-2" />
            Nueva Cancha
          </Button>
        </div>

        {/* Filters and View Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Estado
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activa</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                  <option value="INACTIVE">Inactiva</option>
                </select>
              </div>

              {/* Sport Type Filter */}
              <div>
                <label htmlFor="sport" className="block text-sm font-medium mb-2">
                  Deporte
                </label>
                <select
                  id="sport"
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ALL">Todos</option>
                  <option value="SOCCER">Fútbol</option>
                  <option value="PADEL">Pádel</option>
                  <option value="TENNIS">Tenis</option>
                  <option value="MULTI">Multiuso</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="md:col-span-2 flex items-end">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode('grid')}
                    size="sm"
                  >
                    <MdViewModule className="mr-2" />
                    Tarjetas
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                    size="sm"
                  >
                    <MdTableRows className="mr-2" />
                    Tabla
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courts List/Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Canchas ({filteredCourts.length})
              </CardTitle>
              {loading && <Spinner />}
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? (
              <CourtList
                courts={filteredCourts}
                loading={loading}
                error={error}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChangeClick}
                onCreate={handleCreateClick}
              />
            ) : (
              <CourtTable
                courts={filteredCourts}
                loading={loading}
                error={error}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChangeClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Form Modal */}
        <Dialog
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedCourt(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCourt ? 'Editar Cancha' : 'Nueva Cancha'}
              </DialogTitle>
            </DialogHeader>
            <CourtForm
              court={selectedCourt || undefined}
              facilityId={selectedFacility?.id || ''}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedCourt(null);
              }}
              isSubmitting={creating || updating}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCourtToDelete(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Cancha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar la cancha <strong>{courtToDelete?.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción marcará la cancha como inactiva. Podrás reactivarla más tarde si es necesario.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCourtToDelete(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting && <Spinner className="mr-2" />}
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Change Modal */}
        <Dialog
          open={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setCourtToChangeStatus(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Estado de Cancha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Cambiar estado de <strong>{courtToChangeStatus?.name}</strong>
              </p>
              <div>
                <label htmlFor="newStatus" className="block text-sm font-medium mb-2">
                  Nuevo Estado
                </label>
                <select
                  id="newStatus"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CourtStatus)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ACTIVE">Activa</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                  <option value="INACTIVE">Inactiva</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setCourtToChangeStatus(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmStatusChange}
                  disabled={updating}
                >
                  {updating && <Spinner className="mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
