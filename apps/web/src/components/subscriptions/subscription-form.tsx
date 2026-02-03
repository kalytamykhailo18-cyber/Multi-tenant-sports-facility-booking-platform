// Subscription Form Component
// Form for creating and editing subscriptions

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Subscription, CreateSubscriptionRequest, UpdateSubscriptionRequest, BillingCycle } from '@/lib/subscriptions-api';

interface SubscriptionFormProps {
  subscription?: Subscription;
  tenantId?: string;
  tenantName?: string;
  onSubmit: (data: CreateSubscriptionRequest | UpdateSubscriptionRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SubscriptionForm({
  subscription,
  tenantId,
  tenantName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SubscriptionFormProps) {
  const isEditing = !!subscription;

  // Form state
  const [planName, setPlanName] = useState(subscription?.planName || 'Standard');
  const [priceAmount, setPriceAmount] = useState(subscription?.priceAmount || 0);
  const [currency, setCurrency] = useState(subscription?.currency || 'ARS');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle || 'MONTHLY');
  const [dueSoonDays, setDueSoonDays] = useState(subscription?.dueSoonDays || 5);
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!planName.trim()) {
      setError('El nombre del plan es requerido');
      return;
    }

    if (priceAmount <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    if (!isEditing && !tenantId) {
      setError('El tenant ID es requerido');
      return;
    }

    setError(null);

    try {
      if (isEditing) {
        const updateData: UpdateSubscriptionRequest = {
          planName: planName.trim(),
          priceAmount,
          currency: currency.trim().toUpperCase(),
          billingCycle,
          dueSoonDays,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateSubscriptionRequest = {
          tenantId: tenantId!,
          planName: planName.trim(),
          priceAmount,
          currency: currency.trim().toUpperCase(),
          billingCycle,
          dueSoonDays,
          startDate: startDate || undefined,
        };
        await onSubmit(createData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-md mx-4 my-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Suscripción' : 'Nueva Suscripción'}
          </CardTitle>
          {tenantName && (
            <p className="text-sm text-muted-foreground">
              Tenant: {tenantName}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="planName">Nombre del Plan *</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ej: Standard, Premium"
              disabled={isSubmitting}
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceAmount">Precio *</Label>
              <Input
                id="priceAmount"
                type="number"
                min={0}
                step={0.01}
                value={priceAmount}
                onChange={(e) => setPriceAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="ARS"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-2">
            <Label>Ciclo de Facturación *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={billingCycle === 'MONTHLY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('MONTHLY')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Mensual
              </Button>
              <Button
                type="button"
                variant={billingCycle === 'YEARLY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('YEARLY')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Anual
              </Button>
            </div>
          </div>

          {/* Due Soon Days */}
          <div className="space-y-2">
            <Label htmlFor="dueSoonDays">Días de aviso previo</Label>
            <Input
              id="dueSoonDays"
              type="number"
              min={1}
              max={30}
              value={dueSoonDays}
              onChange={(e) => setDueSoonDays(parseInt(e.target.value) || 5)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Días antes del vencimiento para marcar como "Por vencer"
            </p>
          </div>

          {/* Start Date (only for create) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio (opcional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Si no se especifica, se usará la fecha actual
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !planName.trim() || priceAmount <= 0}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Guardar' : 'Crear'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
