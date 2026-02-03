// Subscription Card Component
// Displays a single subscription with quick actions

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionStatusBadge } from './subscription-status-badge';
import type { Subscription } from '@/lib/subscriptions-api';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit?: (subscription: Subscription) => void;
  onSuspend?: (subscription: Subscription) => void;
  onReactivate?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onView?: (subscription: Subscription) => void;
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onSuspend,
  onReactivate,
  onCancel,
  onView,
}: SubscriptionCardProps) {
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
    return cycle === 'MONTHLY' ? 'Mensual' : 'Anual';
  };

  const getDaysUntilDueLabel = () => {
    if (subscription.daysUntilDue < 0) {
      return `Vencida hace ${Math.abs(subscription.daysUntilDue)} días`;
    }
    if (subscription.daysUntilDue === 0) {
      return 'Vence hoy';
    }
    return `Vence en ${subscription.daysUntilDue} días`;
  };

  const canSuspend = subscription.status === 'ACTIVE' || subscription.status === 'DUE_SOON' || subscription.status === 'OVERDUE';
  const canReactivate = subscription.status === 'SUSPENDED';
  const canCancel = subscription.status !== 'CANCELLED';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{subscription.planName}</CardTitle>
            {subscription.tenantName && (
              <p className="text-sm text-muted-foreground mt-1">
                {subscription.tenantName}
              </p>
            )}
          </div>
          <SubscriptionStatusBadge status={subscription.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Pricing */}
        <div className="mb-4">
          <p className="text-2xl font-bold">
            {formatCurrency(subscription.priceAmount, subscription.currency)}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {getBillingCycleLabel(subscription.billingCycle).toLowerCase()}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-sm font-semibold">{formatDate(subscription.nextPaymentDate)}</p>
            <p className="text-xs text-muted-foreground">Próximo pago</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-sm font-semibold">{getDaysUntilDueLabel()}</p>
            <p className="text-xs text-muted-foreground">Estado</p>
          </div>
        </div>

        {/* Period info */}
        <div className="text-sm text-muted-foreground mb-4 space-y-1">
          <p>
            Período: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
          </p>
          {subscription.lastPaymentDate && (
            <p>
              Último pago: {formatDate(subscription.lastPaymentDate)}
              {subscription.lastPaymentAmount && (
                <span> ({formatCurrency(subscription.lastPaymentAmount, subscription.currency)})</span>
              )}
            </p>
          )}
        </div>

        {/* Meta info */}
        <p className="text-xs text-muted-foreground mb-4">
          Creada: {formatDate(subscription.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(subscription)}
            >
              Ver
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(subscription)}
            >
              Editar
            </Button>
          )}
          {onSuspend && canSuspend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuspend(subscription)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              Suspender
            </Button>
          )}
          {onReactivate && canReactivate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(subscription)}
              className="text-green-600 hover:text-green-700"
            >
              Reactivar
            </Button>
          )}
          {onCancel && canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(subscription)}
              className="text-destructive hover:text-destructive"
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
