// Customer Table Component
// Displays customers in table format with sorting

'use client';

import { Button } from '@/components/ui/button';
import { CustomerReputationBadge } from './customer-reputation-badge';
import { CustomerBlockedBadge } from './customer-blocked-badge';
import type { CustomerSummary, QueryCustomerParams } from '@/lib/customers-api';
import { formatPhone, formatDate } from '@/lib/customers-api';

interface CustomerTableProps {
  customers: CustomerSummary[];
  sortBy?: QueryCustomerParams['sortBy'];
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: QueryCustomerParams['sortBy']) => void;
  onView?: (customer: CustomerSummary) => void;
  onEdit?: (customer: CustomerSummary) => void;
  onBlock?: (customer: CustomerSummary) => void;
  onContact?: (customer: CustomerSummary) => void;
  onRowClick?: (customer: CustomerSummary) => void;
}

export function CustomerTable({
  customers,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onBlock,
  onContact,
  onRowClick,
}: CustomerTableProps) {
  const getSortIndicator = (column: QueryCustomerParams['sortBy']) => {
    if (sortBy !== column) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleSort = (column: QueryCustomerParams['sortBy']) => {
    if (onSort) {
      onSort(column);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th
              className="text-left p-3 font-medium cursor-pointer hover:bg-muted"
              onClick={() => handleSort('name')}
            >
              Nombre{getSortIndicator('name')}
            </th>
            <th
              className="text-left p-3 font-medium cursor-pointer hover:bg-muted"
              onClick={() => handleSort('phone')}
            >
              Teléfono{getSortIndicator('phone')}
            </th>
            <th
              className="text-left p-3 font-medium cursor-pointer hover:bg-muted"
              onClick={() => handleSort('reputationScore')}
            >
              Reputación{getSortIndicator('reputationScore')}
            </th>
            <th
              className="text-center p-3 font-medium cursor-pointer hover:bg-muted"
              onClick={() => handleSort('totalBookings')}
            >
              Reservas{getSortIndicator('totalBookings')}
            </th>
            <th className="text-center p-3 font-medium">No shows</th>
            <th
              className="text-left p-3 font-medium cursor-pointer hover:bg-muted"
              onClick={() => handleSort('lastBookingDate')}
            >
              Última reserva{getSortIndicator('lastBookingDate')}
            </th>
            <th className="text-left p-3 font-medium">Estado</th>
            <th className="text-right p-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={`border-b hover:bg-muted/30 ${customer.isBlocked ? 'opacity-60' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(customer)}
            >
              <td className="p-3">
                <span className="font-medium">{customer.name}</span>
                {customer.email && (
                  <span className="block text-sm text-muted-foreground">{customer.email}</span>
                )}
              </td>
              <td className="p-3 text-sm">{formatPhone(customer.phone)}</td>
              <td className="p-3">
                <CustomerReputationBadge
                  level={customer.reputationLevel}
                  score={customer.reputationScore}
                  showScore
                />
              </td>
              <td className="p-3 text-center">{customer.totalBookings}</td>
              <td className="p-3 text-center">
                <span className={customer.noShowCount > 0 ? 'text-destructive font-medium' : ''}>
                  {customer.noShowCount}
                </span>
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {customer.lastBookingDate ? formatDate(customer.lastBookingDate) : '-'}
              </td>
              <td className="p-3">
                <CustomerBlockedBadge isBlocked={customer.isBlocked} />
              </td>
              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  {onView && (
                    <Button variant="ghost" size="sm" onClick={() => onView(customer)}>
                      Ver
                    </Button>
                  )}
                  {onContact && (
                    <Button variant="ghost" size="sm" onClick={() => onContact(customer)}>
                      Contactar
                    </Button>
                  )}
                  {onEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(customer)}>
                      Editar
                    </Button>
                  )}
                  {onBlock && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBlock(customer)}
                      className={customer.isBlocked ? '' : 'text-destructive hover:text-destructive'}
                    >
                      {customer.isBlocked ? 'Desbloquear' : 'Bloquear'}
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
