// Customer Card Component
// Displays a single customer with summary information

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerReputationBadge } from './customer-reputation-badge';
import { CustomerBlockedBadge } from './customer-blocked-badge';
import type { CustomerSummary } from '@/lib/customers-api';
import { formatPhone, formatDate } from '@/lib/customers-api';

interface CustomerCardProps {
  customer: CustomerSummary;
  onView?: (customer: CustomerSummary) => void;
  onEdit?: (customer: CustomerSummary) => void;
  onBlock?: (customer: CustomerSummary) => void;
  onContact?: (customer: CustomerSummary) => void;
}

export function CustomerCard({ customer, onView, onEdit, onBlock, onContact }: CustomerCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${customer.isBlocked ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{customer.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{formatPhone(customer.phone)}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <CustomerReputationBadge
              level={customer.reputationLevel}
              score={customer.reputationScore}
              showScore
            />
            <CustomerBlockedBadge isBlocked={customer.isBlocked} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Email if available */}
        {customer.email && (
          <p className="text-sm text-muted-foreground mb-3">{customer.email}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xl font-semibold">{customer.totalBookings}</p>
            <p className="text-xs text-muted-foreground">Reservas</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xl font-semibold">{customer.noShowCount}</p>
            <p className="text-xs text-muted-foreground">No shows</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xl font-semibold">{customer.reputationScore}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
        </div>

        {/* Last booking */}
        {customer.lastBookingDate && (
          <p className="text-xs text-muted-foreground mb-4">
            Última reserva: {formatDate(customer.lastBookingDate)}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(customer)}>
              Ver perfil
            </Button>
          )}
          {onContact && (
            <Button variant="outline" size="sm" onClick={() => onContact(customer)}>
              Contactar
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
              Editar
            </Button>
          )}
          {onBlock && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBlock(customer)}
              className={customer.isBlocked ? '' : 'text-destructive hover:text-destructive'}
            >
              {customer.isBlocked ? 'Desbloquear' : 'Bloquear'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
