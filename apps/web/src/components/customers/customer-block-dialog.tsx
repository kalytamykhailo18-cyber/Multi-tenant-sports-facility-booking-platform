// Customer Block Dialog Component
// Dialog for blocking/unblocking customers with reason

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { CustomerSummary } from '@/lib/customers-api';

interface CustomerBlockDialogProps {
  customer: CustomerSummary;
  onConfirm: (reason?: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CustomerBlockDialog({
  customer,
  onConfirm,
  onCancel,
  isSubmitting,
}: CustomerBlockDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const isBlocking = !customer.isBlocked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reason is required when blocking
    if (isBlocking && !reason.trim()) {
      setError('La razón es requerida al bloquear un cliente');
      return;
    }

    await onConfirm(isBlocking ? reason : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-md mx-4 my-auto">
        <CardHeader>
          <CardTitle>
            {isBlocking ? 'Bloquear Cliente' : 'Desbloquear Cliente'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isBlocking
              ? `¿Estás seguro de bloquear a "${customer.name}"? El cliente no podrá hacer reservas.`
              : `¿Estás seguro de desbloquear a "${customer.name}"? El cliente podrá volver a hacer reservas.`}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Customer info */}
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              <p className="text-sm text-muted-foreground">
                Reputación: {customer.reputationScore} puntos
              </p>
            </div>

            {/* Reason - only for blocking */}
            {isBlocking && (
              <div className="space-y-2">
                <Label htmlFor="reason">Razón del bloqueo *</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej: Múltiples no-shows, comportamiento inapropiado..."
                  className={error ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={isBlocking ? 'destructive' : 'default'}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {isBlocking ? 'Bloqueando...' : 'Desbloqueando...'}
                </>
              ) : isBlocking ? (
                'Bloquear cliente'
              ) : (
                'Desbloquear cliente'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
