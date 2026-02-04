// Customer Profile Header Component
// Displays customer profile information with quick actions

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerReputationBadge } from './customer-reputation-badge';
import { CustomerBlockedBadge } from './customer-blocked-badge';
import type { CustomerWithRelations } from '@/lib/customers-api';
import { formatPhone, formatDate, formatCurrency } from '@/lib/customers-api';

interface CustomerProfileHeaderProps {
  customer: CustomerWithRelations;
  onEdit?: () => void;
  onBlock?: () => void;
  onUpdateReputation?: () => void;
  onAddCredit?: () => void;
}

export function CustomerProfileHeader({
  customer,
  onEdit,
  onBlock,
  onUpdateReputation,
  onAddCredit,
}: CustomerProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              {/* Avatar placeholder */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{customer.name}</h1>
                  <CustomerReputationBadge
                    level={customer.reputationLevel}
                    score={customer.reputationScore}
                    showScore
                  />
                  <CustomerBlockedBadge isBlocked={customer.isBlocked} />
                </div>

                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>{formatPhone(customer.phone)}</p>
                  {customer.email && <p>{customer.email}</p>}
                  {customer.preferredCourtName && (
                    <p>Cancha preferida: {customer.preferredCourtName}</p>
                  )}
                  {customer.preferredTime && (
                    <p>Horario preferido: {customer.preferredTime}</p>
                  )}
                </div>

                {customer.blockedReason && (
                  <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded-md">
                    Razón del bloqueo: {customer.blockedReason}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Notas:</p>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-2">
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">{customer.totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total reservas</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">{customer.completedBookings}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold text-destructive">{customer.noShowCount}</p>
              <p className="text-xs text-muted-foreground">No shows</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">{customer.cancellationCount}</p>
              <p className="text-xs text-muted-foreground">Cancelaciones</p>
            </div>
          </div>
        </div>

        {/* Credit and dates */}
        <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Crédito disponible:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(customer.creditBalance)}
            </span>
          </div>
          {customer.lastBookingDate && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Última reserva:</span>
              <span className="text-sm">{formatDate(customer.lastBookingDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Cliente desde:</span>
            <span className="text-sm">{formatDate(customer.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar información
            </Button>
          )}
          {onUpdateReputation && (
            <Button variant="outline" size="sm" onClick={onUpdateReputation}>
              Ajustar reputación
            </Button>
          )}
          {onAddCredit && (
            <Button variant="outline" size="sm" onClick={onAddCredit}>
              Agregar crédito
            </Button>
          )}
          {onBlock && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBlock}
              className={customer.isBlocked ? '' : 'text-destructive hover:text-destructive'}
            >
              {customer.isBlocked ? 'Desbloquear' : 'Bloquear cliente'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
