// Court List Component
// Displays a grid of courts with filtering and actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CourtCard } from './court-card';
import type { Court } from '@/lib/courts-api';

interface CourtListProps {
  courts: Court[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onEdit?: (court: Court) => void;
  onDelete?: (court: Court) => void;
  onStatusChange?: (court: Court) => void;
  onCreate?: () => void;
}

export function CourtList({
  courts,
  loading = false,
  error,
  emptyMessage = 'No hay canchas registradas',
  onEdit,
  onDelete,
  onStatusChange,
  onCreate,
}: CourtListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">{emptyMessage}</p>
          {onCreate && (
            <Button onClick={onCreate}>
              Agregar Cancha
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {courts.length} {courts.length === 1 ? 'cancha' : 'canchas'}
        </p>
        {onCreate && (
          <Button onClick={onCreate}>
            Agregar Cancha
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

// Table view variant for compact display
interface CourtTableProps {
  courts: Court[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (court: Court) => void;
  onDelete?: (court: Court) => void;
  onStatusChange?: (court: Court) => void;
}

export function CourtTable({
  courts,
  loading = false,
  error,
  onEdit,
  onDelete,
  onStatusChange,
}: CourtTableProps) {
  const formatPrice = (price: number, currency?: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive py-8">{error}</p>
    );
  }

  if (courts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay canchas registradas
      </p>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium">Nombre</th>
            <th className="text-left px-4 py-3 text-sm font-medium">Deporte</th>
            <th className="text-left px-4 py-3 text-sm font-medium">Precio/Hora</th>
            <th className="text-left px-4 py-3 text-sm font-medium">Tipo</th>
            <th className="text-left px-4 py-3 text-sm font-medium">Estado</th>
            <th className="text-right px-4 py-3 text-sm font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {courts.map((court) => (
            <tr key={court.id} className="border-t hover:bg-muted/50">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium">{court.name}</p>
                  {court.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {court.description}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm">
                  {court.sportType === 'SOCCER' && 'Fútbol'}
                  {court.sportType === 'PADEL' && 'Pádel'}
                  {court.sportType === 'TENNIS' && 'Tenis'}
                  {court.sportType === 'MULTI' && 'Multiuso'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium">
                  {formatPrice(court.basePricePerHour, court.currencyCode)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm">
                  {court.isIndoor ? 'Techada' : 'Descubierta'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    court.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : court.status === 'MAINTENANCE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {court.status === 'ACTIVE' && 'Activa'}
                  {court.status === 'MAINTENANCE' && 'Mantenimiento'}
                  {court.status === 'INACTIVE' && 'Inactiva'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(court)}
                    >
                      Editar
                    </Button>
                  )}
                  {onStatusChange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(court)}
                    >
                      Estado
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(court)}
                      className="text-destructive hover:text-destructive"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
