// Payment History Table Component
// Displays paginated payment history

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PaymentHistoryResponse, PaymentType } from '@/lib/reports-api';
import { FiCalendar, FiUser, FiDollarSign, FiClock } from 'react-icons/fi';
import { MdOutlineAttachMoney, MdOutlinePayment } from 'react-icons/md';

interface PaymentHistoryTableProps {
  data: PaymentHistoryResponse;
  onPageChange?: (page: number) => void;
}

export function PaymentHistoryTable({ data, onPageChange }: PaymentHistoryTableProps) {
  const currentPage = data.page;
  const totalPages = Math.ceil(data.total / data.pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Get payment type badge color
  const getPaymentTypeBadge = (type: PaymentType) => {
    switch (type) {
      case 'DEPOSIT':
        return <Badge variant="outline" className="bg-blue-50">Seña</Badge>;
      case 'BALANCE':
        return <Badge variant="outline" className="bg-green-50">Saldo</Badge>;
      case 'REFUND':
        return <Badge variant="outline" className="bg-red-50">Reembolso</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="animate-fade-up-fast">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MdOutlinePayment className="w-5 h-5 text-primary" />
            <CardTitle>Historial de Pagos</CardTitle>
          </div>
          <CardDescription>
            {data.total} pago{data.total !== 1 ? 's' : ''} registrado{data.total !== 1 ? 's' : ''} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mostrando</p>
              <p className="text-lg font-semibold">
                {data.payments.length} de {data.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Página</p>
              <p className="text-lg font-semibold">
                {currentPage} de {totalPages}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="animate-fade-up-normal">
        <CardContent className="pt-6">
          {data.payments.length === 0 ? (
            <div className="text-center py-12">
              <MdOutlinePayment className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.payments.map((payment, index) => {
                const animations = [
                  'animate-fade-left-fast',
                  'animate-fade-right-normal',
                  'animate-fade-up-slow',
                  'animate-zoom-in-fast',
                  'animate-fade-down-normal',
                ];

                return (
                  <Card key={`${payment.bookingId}-${payment.type}`} className={animations[index % animations.length]}>
                    <CardContent className="pt-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Payment Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getPaymentTypeBadge(payment.type)}
                            <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <FiUser className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{payment.customerName}</span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <FiCalendar className="w-3 h-3" />
                              <span>{formatDate(payment.date)}</span>
                            </div>
                            {payment.paidAt && (
                              <div className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                <span>Pagado a las {formatTime(payment.paidAt)}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            ID Reserva: {payment.bookingId.slice(0, 8)}...
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Monto</p>
                            <p className={`text-2xl font-bold ${
                              payment.type === 'REFUND' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {payment.type === 'REFUND' ? '-' : ''}${payment.amount.toLocaleString()}
                            </p>
                          </div>
                          <MdOutlineAttachMoney className="w-6 h-6 text-muted-foreground" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="animate-fade-up-slow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={!hasPrevPage}
                className="rounded-md"
              >
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={!hasNextPage}
                className="rounded-md"
              >
                Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
