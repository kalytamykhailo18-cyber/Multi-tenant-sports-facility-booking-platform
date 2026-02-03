// Subscription Status Display Component
// Displays subscription status in facility detail page context

'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SubscriptionStatusBadge } from './subscription-status-badge';
import { useSubscriptions } from '@/hooks/useSubscriptions';

interface SubscriptionStatusDisplayProps {
  tenantId: string;
  onManageSubscription?: () => void;
}

export function SubscriptionStatusDisplay({
  tenantId,
  onManageSubscription,
}: SubscriptionStatusDisplayProps) {
  const {
    selectedSubscription: subscription,
    loadingSubscription: loading,
    error,
    loadSubscriptionByTenant,
    clearError,
  } = useSubscriptions();

  // Load subscription on mount
  useEffect(() => {
    if (tenantId) {
      loadSubscriptionByTenant(tenantId);
    }
  }, [tenantId, loadSubscriptionByTenant]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getBillingCycleLabel = (cycle: string) => {
    return cycle === 'MONTHLY' ? 'mensual' : 'anual';
  };

  const getDaysUntilDueMessage = () => {
    if (!subscription) return '';

    if (subscription.daysUntilDue < 0) {
      return `Vencida hace ${Math.abs(subscription.daysUntilDue)} días`;
    }
    if (subscription.daysUntilDue === 0) {
      return 'Vence hoy';
    }
    if (subscription.daysUntilDue <= subscription.dueSoonDays) {
      return `Vence en ${subscription.daysUntilDue} días`;
    }
    return `Próximo pago: ${formatDate(subscription.nextPaymentDate)}`;
  };

  const getStatusMessage = () => {
    if (!subscription) return '';

    switch (subscription.status) {
      case 'ACTIVE':
        return 'Tu suscripción está activa y funcionando correctamente.';
      case 'DUE_SOON':
        return 'Tu suscripción vence pronto. Realiza el pago para evitar interrupciones.';
      case 'OVERDUE':
        return 'Tu pago está vencido. Realiza el pago para continuar usando el servicio.';
      case 'SUSPENDED':
        return 'Servicio suspendido. Por favor realiza el pago para reactivar.';
      case 'CANCELLED':
        return 'Esta suscripción ha sido cancelada.';
      default:
        return '';
    }
  };

  const needsPaymentAction = subscription &&
    ['DUE_SOON', 'OVERDUE', 'SUSPENDED'].includes(subscription.status);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={clearError}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Suscripción</CardTitle>
          <CardDescription>
            No hay suscripción configurada para esta instalación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contacta al administrador para configurar una suscripción.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={
      subscription.status === 'SUSPENDED' ? 'border-destructive' :
      subscription.status === 'OVERDUE' ? 'border-yellow-500' :
      subscription.status === 'DUE_SOON' ? 'border-yellow-400' :
      ''
    }>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Estado de Suscripción</CardTitle>
            <CardDescription className="mt-1">
              Plan {subscription.planName}
            </CardDescription>
          </div>
          <SubscriptionStatusBadge status={subscription.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status message */}
        {subscription.status !== 'ACTIVE' && (
          <div className={`p-3 rounded-md text-sm ${
            subscription.status === 'SUSPENDED' ? 'bg-destructive/10 text-destructive' :
            subscription.status === 'OVERDUE' ? 'bg-yellow-500/10 text-yellow-700' :
            subscription.status === 'DUE_SOON' ? 'bg-yellow-400/10 text-yellow-600' :
            subscription.status === 'CANCELLED' ? 'bg-muted text-muted-foreground' :
            'bg-muted'
          }`}>
            {getStatusMessage()}
          </div>
        )}

        {/* Pricing info */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {formatCurrency(subscription.priceAmount, subscription.currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {getBillingCycleLabel(subscription.billingCycle)}
          </span>
        </div>

        {/* Payment dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">
              {getDaysUntilDueMessage()}
            </p>
            <p className="text-xs text-muted-foreground">Estado del pago</p>
          </div>
          {subscription.lastPaymentDate && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {formatDate(subscription.lastPaymentDate)}
              </p>
              <p className="text-xs text-muted-foreground">Último pago</p>
            </div>
          )}
        </div>

        {/* Period info */}
        <div className="text-sm text-muted-foreground">
          <p>
            Período actual: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
          </p>
          {subscription.lastPaymentAmount && subscription.lastPaymentDate && (
            <p className="mt-1">
              Último pago: {formatCurrency(subscription.lastPaymentAmount, subscription.currency)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {needsPaymentAction && (
            <Button className="flex-1">
              Realizar Pago
            </Button>
          )}
          {onManageSubscription && (
            <Button
              variant={needsPaymentAction ? 'outline' : 'default'}
              className={needsPaymentAction ? '' : 'flex-1'}
              onClick={onManageSubscription}
            >
              Administrar
            </Button>
          )}
        </div>

        {/* Alert for suspended */}
        {subscription.status === 'SUSPENDED' && (
          <div className="text-xs text-destructive border-t pt-3 mt-2">
            <strong>Importante:</strong> Mientras la suscripción esté suspendida:
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>El bot de WhatsApp no responderá</li>
              <li>No se podrán crear nuevas reservas</li>
              <li>Puedes ver el calendario en modo lectura</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
