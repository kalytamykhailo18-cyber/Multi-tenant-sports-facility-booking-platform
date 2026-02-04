// Customer Reputation Dialog Component
// Dialog for manually adjusting customer reputation

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { CustomerWithRelations } from '@/lib/customers-api';
import { getReputationLevel, getReputationLevelLabel } from '@/lib/customers-api';

interface CustomerReputationDialogProps {
  customer: CustomerWithRelations;
  onConfirm: (score: number, reason?: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CustomerReputationDialog({
  customer,
  onConfirm,
  onCancel,
  isSubmitting,
}: CustomerReputationDialogProps) {
  const [score, setScore] = useState(customer.reputationScore);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const previewLevel = getReputationLevel(score);
  const isChanged = score !== customer.reputationScore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (score < 0 || score > 200) {
      setError('El puntaje debe estar entre 0 y 200');
      return;
    }

    if (!isChanged) {
      setError('El puntaje no ha cambiado');
      return;
    }

    await onConfirm(score, reason || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-md mx-4 my-auto">
        <CardHeader>
          <CardTitle>Ajustar Reputación</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Ajustar manualmente el puntaje de reputación de {customer.name}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Current reputation */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Reputación actual</p>
              <p className="font-semibold">
                {customer.reputationScore} puntos - {getReputationLevelLabel(customer.reputationLevel)}
              </p>
            </div>

            {/* New score */}
            <div className="space-y-2">
              <Label htmlFor="score">Nuevo puntaje (0-200)</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={200}
                value={score}
                onChange={(e) => {
                  setScore(parseInt(e.target.value) || 0);
                  setError('');
                }}
                disabled={isSubmitting}
                className={error ? 'border-destructive' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Nuevo nivel: {getReputationLevelLabel(previewLevel)}
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {/* Quick adjustment buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScore(Math.min(200, score + 10))}
                disabled={isSubmitting}
              >
                +10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScore(Math.min(200, score + 5))}
                disabled={isSubmitting}
              >
                +5
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScore(Math.max(0, score - 5))}
                disabled={isSubmitting}
              >
                -5
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScore(Math.max(0, score - 10))}
                disabled={isSubmitting}
              >
                -10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScore(100)}
                disabled={isSubmitting}
              >
                Reset (100)
              </Button>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Razón del ajuste (opcional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Ajuste por compensación, error administrativo..."
                disabled={isSubmitting}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !isChanged}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
