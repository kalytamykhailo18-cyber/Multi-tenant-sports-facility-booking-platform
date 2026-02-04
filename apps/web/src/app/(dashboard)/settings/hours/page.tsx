// Operating Hours Settings Page
// Manage facility operating hours and special hours (holidays/closures)

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserFacility } from '@/hooks/useFacilities';
import {
  useOperatingHours,
  useOperatingHoursForm,
  useSpecialHoursForm,
} from '@/hooks/useOperatingHours';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OperatingHoursForm } from '@/components/operating-hours/operating-hours-form';
import type { SpecialHours, CreateSpecialHoursRequest } from '@/lib/operating-hours-api';
import { MdAdd, MdDelete, MdEdit, MdCalendarToday } from 'react-icons/md';

export default function OperatingHoursPage() {
  const { user } = useAuth();
  const { selectedFacility, loadUserFacility, loading: loadingFacility } = useUserFacility();
  const {
    weeklySchedule,
    specialHours,
    loading,
    loadingSpecialHours,
    error,
    loadByFacility,
    loadSpecialHours,
    clearError,
  } = useOperatingHours();

  const {
    submit: submitSchedule,
    createDefaults,
    isSubmitting,
    isCreatingDefaults,
  } = useOperatingHoursForm(selectedFacility?.id || '');

  const {
    submit: submitSpecialHours,
    remove: removeSpecialHours,
    isSubmitting: isSubmittingSpecial,
    isDeleting: isDeletingSpecial,
  } = useSpecialHoursForm();

  // Special hours modal state
  const [isSpecialHoursModalOpen, setIsSpecialHoursModalOpen] = useState(false);
  const [specialHoursToEdit, setSpecialHoursToEdit] = useState<SpecialHours | null>(null);
  const [specialHoursForm, setSpecialHoursForm] = useState<CreateSpecialHoursRequest>({
    facilityId: selectedFacility?.id || '',
    date: new Date().toISOString().split('T')[0],
    isClosed: true,
    openTime: undefined,
    closeTime: undefined,
    reason: '',
  });

  // Load user's facility on mount
  useEffect(() => {
    if (user?.tenantId) {
      loadUserFacility();
    }
  }, [user?.tenantId, loadUserFacility]);

  // Load operating hours when facility is loaded
  useEffect(() => {
    if (selectedFacility?.id) {
      loadByFacility(selectedFacility.id);
      loadSpecialHours(selectedFacility.id);
    }
  }, [selectedFacility?.id, loadByFacility, loadSpecialHours]);

  // Handle schedule submission
  const handleScheduleSubmit = async (data: any) => {
    try {
      await submitSchedule(data);
      if (selectedFacility?.id) {
        loadByFacility(selectedFacility.id);
      }
    } catch (error) {
      // Error handled by store
    }
  };

  // Handle create defaults
  const handleCreateDefaults = async () => {
    try {
      await createDefaults();
      if (selectedFacility?.id) {
        loadByFacility(selectedFacility.id);
      }
    } catch (error) {
      // Error handled by store
    }
  };

  // Handle special hours creation/update
  const handleSpecialHoursSubmit = async () => {
    try {
      if (specialHoursToEdit) {
        await submitSpecialHours({ ...specialHoursForm, id: specialHoursToEdit.id });
      } else {
        await submitSpecialHours({ ...specialHoursForm, facilityId: selectedFacility?.id! });
      }
      setIsSpecialHoursModalOpen(false);
      setSpecialHoursToEdit(null);
      resetSpecialHoursForm();
      if (selectedFacility?.id) {
        loadSpecialHours(selectedFacility.id);
      }
    } catch (error) {
      // Error handled by store
    }
  };

  // Handle special hours deletion
  const handleSpecialHoursDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario especial?')) return;

    try {
      await removeSpecialHours(id);
      if (selectedFacility?.id) {
        loadSpecialHours(selectedFacility.id);
      }
    } catch (error) {
      // Error handled by store
    }
  };

  // Open special hours modal for creation
  const handleAddSpecialHours = () => {
    resetSpecialHoursForm();
    setSpecialHoursToEdit(null);
    setIsSpecialHoursModalOpen(true);
  };

  // Open special hours modal for editing
  const handleEditSpecialHours = (special: SpecialHours) => {
    setSpecialHoursToEdit(special);
    setSpecialHoursForm({
      facilityId: special.facilityId,
      date: special.date.split('T')[0],
      isClosed: special.isClosed,
      openTime: special.openTime || undefined,
      closeTime: special.closeTime || undefined,
      reason: special.reason || '',
    });
    setIsSpecialHoursModalOpen(true);
  };

  // Reset special hours form
  const resetSpecialHoursForm = () => {
    setSpecialHoursForm({
      facilityId: selectedFacility?.id || '',
      date: new Date().toISOString().split('T')[0],
      isClosed: true,
      openTime: undefined,
      closeTime: undefined,
      reason: '',
    });
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
        <div>
          <h1 className="text-3xl font-bold">Horarios de Atención</h1>
          <p className="text-muted-foreground mt-1">
            Configura los horarios regulares y especiales de tu instalación
          </p>
        </div>

        {/* Loading State */}
        {(loadingFacility || (!weeklySchedule && loading)) && (
          <Card>
            <CardContent className="flex justify-center py-8">
              <Spinner size="lg" />
            </CardContent>
          </Card>
        )}

        {/* No Schedule - Create Defaults */}
        {!loading && !weeklySchedule && selectedFacility && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración Inicial</CardTitle>
              <CardDescription>
                No hay horarios configurados. Crea horarios predeterminados para comenzar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateDefaults} disabled={isCreatingDefaults}>
                {isCreatingDefaults && <Spinner className="mr-2" />}
                Crear Horarios Predeterminados
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Operating Hours Form */}
        {weeklySchedule && selectedFacility && (
          <OperatingHoursForm
            weeklySchedule={weeklySchedule}
            facilityId={selectedFacility.id}
            onSubmit={handleScheduleSubmit}
            onCreateDefaults={handleCreateDefaults}
            isSubmitting={isSubmitting}
            isCreatingDefaults={isCreatingDefaults}
          />
        )}

        {/* Special Hours (Holidays/Closures) */}
        {selectedFacility && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Horarios Especiales</CardTitle>
                  <CardDescription>
                    Feriados, cierres temporales y horarios excepcionales
                  </CardDescription>
                </div>
                <Button onClick={handleAddSpecialHours} size="sm">
                  <MdAdd className="mr-2" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSpecialHours ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : specialHours.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay horarios especiales configurados
                </p>
              ) : (
                <div className="space-y-2">
                  {specialHours.map((special) => (
                    <div
                      key={special.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <MdCalendarToday className="text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {special.reason || (special.isClosed ? 'Cerrado' : 'Horario Especial')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(special.date).toLocaleDateString('es-AR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            {!special.isClosed &&
                              special.openTime &&
                              special.closeTime &&
                              ` · ${special.openTime} - ${special.closeTime}`}
                            {special.isClosed && ' · Todo el día'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSpecialHours(special)}
                        >
                          <MdEdit />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpecialHoursDelete(special.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <MdDelete />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Special Hours Modal */}
        <Dialog
          open={isSpecialHoursModalOpen}
          onClose={() => {
            setIsSpecialHoursModalOpen(false);
            setSpecialHoursToEdit(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {specialHoursToEdit ? 'Editar Horario Especial' : 'Nuevo Horario Especial'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  Nombre (Opcional)
                </label>
                <input
                  id="reason"
                  type="text"
                  value={specialHoursForm.reason || ''}
                  onChange={(e) =>
                    setSpecialHoursForm({ ...specialHoursForm, reason: e.target.value })
                  }
                  placeholder="Ej: Navidad, Año Nuevo"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  Fecha
                </label>
                <input
                  id="date"
                  type="date"
                  value={specialHoursForm.date}
                  onChange={(e) =>
                    setSpecialHoursForm({ ...specialHoursForm, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={specialHoursForm.isClosed}
                    onChange={(e) =>
                      setSpecialHoursForm({
                        ...specialHoursForm,
                        isClosed: e.target.checked,
                        openTime: e.target.checked ? undefined : specialHoursForm.openTime,
                        closeTime: e.target.checked ? undefined : specialHoursForm.closeTime,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Cerrado todo el día</span>
                </label>
              </div>

              {!specialHoursForm.isClosed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="openTime" className="block text-sm font-medium mb-2">
                      Apertura
                    </label>
                    <input
                      id="openTime"
                      type="time"
                      value={specialHoursForm.openTime || ''}
                      onChange={(e) =>
                        setSpecialHoursForm({ ...specialHoursForm, openTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="closeTime" className="block text-sm font-medium mb-2">
                      Cierre
                    </label>
                    <input
                      id="closeTime"
                      type="time"
                      value={specialHoursForm.closeTime || ''}
                      onChange={(e) =>
                        setSpecialHoursForm({ ...specialHoursForm, closeTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSpecialHoursModalOpen(false);
                    setSpecialHoursToEdit(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSpecialHoursSubmit} disabled={isSubmittingSpecial}>
                  {isSubmittingSpecial && <Spinner className="mr-2" />}
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
