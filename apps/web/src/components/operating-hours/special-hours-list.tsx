// Special Hours List Component
// List and manage special hours (holidays/closures)

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { SpecialHoursForm, SpecialHoursDeleteModal } from './special-hours-form';
import {
  formatDateES,
  type SpecialHours,
  type CreateSpecialHoursRequest,
  type UpdateSpecialHoursRequest,
} from '@/lib/operating-hours-api';

interface SpecialHoursListProps {
  specialHours: SpecialHours[];
  facilityId: string;
  loading?: boolean;
  onCreateSpecialHours: (data: CreateSpecialHoursRequest) => Promise<SpecialHours>;
  onUpdateSpecialHours: (id: string, data: UpdateSpecialHoursRequest) => Promise<SpecialHours>;
  onDeleteSpecialHours: (id: string) => Promise<void>;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function SpecialHoursList({
  specialHours,
  facilityId,
  loading = false,
  onCreateSpecialHours,
  onUpdateSpecialHours,
  onDeleteSpecialHours,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
}: SpecialHoursListProps) {
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpecialHours, setEditingSpecialHours] = useState<SpecialHours | null>(null);
  const [deletingSpecialHours, setDeletingSpecialHours] = useState<SpecialHours | null>(null);

  // Handle create
  const handleCreate = async (data: CreateSpecialHoursRequest | (UpdateSpecialHoursRequest & { id: string })) => {
    await onCreateSpecialHours(data as CreateSpecialHoursRequest);
    setShowCreateForm(false);
  };

  // Handle update
  const handleUpdate = async (data: CreateSpecialHoursRequest | (UpdateSpecialHoursRequest & { id: string })) => {
    if ('id' in data && data.id) {
      const { id, ...updateData } = data;
      await onUpdateSpecialHours(id, updateData);
      setEditingSpecialHours(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (deletingSpecialHours) {
      await onDeleteSpecialHours(deletingSpecialHours.id);
      setDeletingSpecialHours(null);
    }
  };

  // Format time for display
  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time;
  };

  // Check if date is in the past
  const isPastDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  // Separate past and upcoming special hours
  const upcomingHours = specialHours.filter((sh) => !isPastDate(sh.date));
  const pastHours = specialHours.filter((sh) => isPastDate(sh.date));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Horarios Especiales</CardTitle>
            <CardDescription>
              Feriados, cierres especiales y horarios modificados
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            Agregar Fecha Especial
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : specialHours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay horarios especiales configurados.</p>
              <p className="text-sm mt-1">
                Agregue feriados o cierres especiales haciendo clic en &quot;Agregar Fecha
                Especial&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upcoming special hours */}
              {upcomingHours.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Próximos</h4>
                  <div className="space-y-2">
                    {upcomingHours.map((sh) => (
                      <SpecialHoursItem
                        key={sh.id}
                        specialHours={sh}
                        onEdit={() => setEditingSpecialHours(sh)}
                        onDelete={() => setDeletingSpecialHours(sh)}
                        isPast={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past special hours */}
              {pastHours.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Pasados</h4>
                  <div className="space-y-2 opacity-60">
                    {pastHours.slice(0, 5).map((sh) => (
                      <SpecialHoursItem
                        key={sh.id}
                        specialHours={sh}
                        onEdit={() => setEditingSpecialHours(sh)}
                        onDelete={() => setDeletingSpecialHours(sh)}
                        isPast={true}
                      />
                    ))}
                    {pastHours.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        +{pastHours.length - 5} fechas más antiguas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create form modal */}
      {showCreateForm && (
        <SpecialHoursForm
          facilityId={facilityId}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={isCreating}
        />
      )}

      {/* Edit form modal */}
      {editingSpecialHours && (
        <SpecialHoursForm
          specialHours={editingSpecialHours}
          facilityId={facilityId}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSpecialHours(null)}
          isSubmitting={isUpdating}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingSpecialHours && (
        <SpecialHoursDeleteModal
          specialHours={deletingSpecialHours}
          onConfirm={handleDelete}
          onCancel={() => setDeletingSpecialHours(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

// Individual special hours item
interface SpecialHoursItemProps {
  specialHours: SpecialHours;
  onEdit: () => void;
  onDelete: () => void;
  isPast: boolean;
}

function SpecialHoursItem({ specialHours, onEdit, onDelete, isPast }: SpecialHoursItemProps) {
  const date = new Date(specialHours.date);
  const formattedDate = date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
      <div className="flex items-center gap-3">
        {/* Date */}
        <div className="min-w-[140px]">
          <span className="font-medium">{formattedDate}</span>
        </div>

        {/* Status badge */}
        <Badge variant={specialHours.isClosed ? 'destructive' : 'secondary'}>
          {specialHours.isClosed
            ? 'Cerrado'
            : `${specialHours.openTime} - ${specialHours.closeTime}`}
        </Badge>

        {/* Reason */}
        {specialHours.reason && (
          <span className="text-sm text-muted-foreground">{specialHours.reason}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
          Eliminar
        </Button>
      </div>
    </div>
  );
}
