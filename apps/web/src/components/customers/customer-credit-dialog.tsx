// Customer Credit Dialog Component
// Dialog for adding credit to customer account

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { CustomerWithRelations } from '@/lib/customers-api';
import { formatCurrency } from '@/lib/customers-api';

interface CustomerCreditDialogProps {
  customer: CustomerWithRelations;
  onConfirm: (amount: number, reason?: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CustomerCreditDialog({
  customer,
  onConfirm,
  onCancel,
  isSubmitting,
}: CustomerCreditDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const newBalance = customer.creditBalance + parsedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    await onConfirm(parsedAmount, reason || undefined);
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(sanitized);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-md mx-4 my-auto">
        <CardHeader>
          <CardTitle>Agregar Crédito</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Agregar crédito a la cuenta de {customer.name}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Current balance */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Crédito actual</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(customer.creditBalance)}
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto a agregar</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  className={`pl-8 ${error ? 'border-destructive' : ''}`}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('500')}
                disabled={isSubmitting}
              >
                $500
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('1000')}
                disabled={isSubmitting}
              >
                $1,000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('2000')}
                disabled={isSubmitting}
              >
                $2,000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount('5000')}
                disabled={isSubmitting}
              >
                $5,000
              </Button>
            </div>

            {/* New balance preview */}
            {parsedAmount > 0 && (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-muted-foreground">Nuevo saldo</p>
                <p className="font-semibold text-green-600">{formatCurrency(newBalance)}</p>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Razón (opcional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Compensación por cancelación, promoción..."
                disabled={isSubmitting}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || parsedAmount <= 0}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Agregando...
                </>
              ) : (
                'Agregar crédito'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
