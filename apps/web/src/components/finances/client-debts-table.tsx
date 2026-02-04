// Client Debts Table Component
// Displays clients with outstanding balances

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ClientDebtsResponse } from '@/lib/reports-api';
import { FiUsers, FiPhone, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { MdOutlineWarning } from 'react-icons/md';

interface ClientDebtsTableProps {
  data: ClientDebtsResponse;
}

export function ClientDebtsTable({ data }: ClientDebtsTableProps) {
  // Sort debts by amount (highest first)
  const sortedDebts = [...data.debts].sort((a, b) => b.debtAmount - a.debtAmount);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate days overdue
  const getDaysOverdue = (dateStr: string) => {
    const bookingDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - bookingDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="animate-fade-up-fast border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MdOutlineWarning className="w-5 h-5 text-orange-500" />
            <CardTitle>Deudas Pendientes</CardTitle>
          </div>
          <CardDescription>Clientes con saldos sin pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Adeudado</p>
              <p className="text-3xl font-bold text-orange-600">
                ${data.totalDebt.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes con Deuda</p>
              <p className="text-3xl font-bold">{data.clientCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debts Table */}
      <Card className="animate-fade-up-normal">
        <CardHeader>
          <CardTitle>Detalle de Deudas</CardTitle>
          <CardDescription>
            {sortedDebts.length} cliente{sortedDebts.length !== 1 ? 's' : ''} con saldos pendientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDebts.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay deudas pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDebts.map((debt, index) => {
                const daysOverdue = getDaysOverdue(debt.oldestBookingDate);
                const isUrgent = daysOverdue > 7;

                const animations = [
                  'animate-fade-left-fast',
                  'animate-fade-right-normal',
                  'animate-fade-up-slow',
                  'animate-zoom-in-fast',
                  'animate-fade-down-normal',
                ];

                return (
                  <Card
                    key={debt.customerId}
                    className={`${animations[index % animations.length]} ${
                      isUrgent ? 'border-red-200' : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Client Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <FiUsers className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{debt.customerName}</span>
                            {isUrgent && (
                              <MdOutlineWarning className="w-4 h-4 text-red-500" />
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FiPhone className="w-3 h-3" />
                              <span>{debt.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiCalendar className="w-3 h-3" />
                              <span>Desde {formatDate(debt.oldestBookingDate)}</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {debt.pendingBookings} reserva{debt.pendingBookings !== 1 ? 's' : ''}{' '}
                            pendiente{debt.pendingBookings !== 1 ? 's' : ''} • {daysOverdue} día
                            {daysOverdue !== 1 ? 's' : ''} de atraso
                          </div>
                        </div>

                        {/* Debt Amount */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Monto Adeudado</p>
                            <p className="text-2xl font-bold text-orange-600">
                              ${debt.debtAmount.toLocaleString()}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" className="rounded-md">
                              Contactar
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-md">
                              Ver Detalle
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
