// Dashboard Subscription Status Component
// Displays subscription status in dashboard context

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SubscriptionStats } from '@/lib/dashboard-api';

interface SubscriptionStatusProps {
  subscription: SubscriptionStats | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; bgClass: string }> = {
  ACTIVE: { label: 'Activa', variant: 'default', bgClass: '' },
  DUE_SOON: { label: 'Vence Pronto', variant: 'secondary', bgClass: 'border-yellow-500 bg-yellow-500/5' },
  OVERDUE: { label: 'Vencida', variant: 'destructive', bgClass: 'border-destructive bg-destructive/5' },
  SUSPENDED: { label: 'Suspendida', variant: 'destructive', bgClass: 'border-destructive bg-destructive/10' },
  CANCELLED: { label: 'Cancelada', variant: 'outline', bgClass: '' },
};

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const router = useRouter();

  if (!subscription) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sin suscripción configurada
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[subscription.status] || statusConfig.ACTIVE;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysMessage = () => {
    if (subscription.status === 'SUSPENDED') {
      return 'Servicio suspendido';
    }
    if (subscription.daysUntilDue < 0) {
      return `Vencida hace ${Math.abs(subscription.daysUntilDue)} días`;
    }
    if (subscription.daysUntilDue === 0) {
      return 'Vence hoy';
    }
    if (subscription.daysUntilDue <= 5) {
      return `Vence en ${subscription.daysUntilDue} días`;
    }
    return `Próximo pago: ${formatDate(subscription.nextPaymentDate)}`;
  };

  const needsAction = ['DUE_SOON', 'OVERDUE', 'SUSPENDED'].includes(subscription.status);

  return (
    <Card className={config.bgClass}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Suscripción
          </CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{subscription.planName}</p>
          <p className="text-sm text-muted-foreground">{getDaysMessage()}</p>
        </div>
        {needsAction && (
          <Button
            variant={subscription.status === 'SUSPENDED' ? 'destructive' : 'default'}
            className="w-full"
            onClick={() => router.push('/subscription')}
          >
            {subscription.status === 'SUSPENDED' ? 'Reactivar Servicio' : 'Realizar Pago'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface SubscriptionBannerProps {
  subscription: SubscriptionStats | null;
}

export function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  const router = useRouter();

  if (!subscription) {
    return null;
  }

  // Only show banner for suspended subscriptions
  if (subscription.status !== 'SUSPENDED') {
    return null;
  }

  return (
    <div className="p-4 rounded-lg bg-destructive text-destructive-foreground">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">Servicio Suspendido</p>
          <p className="text-sm opacity-90">
            Tu suscripción está suspendida. Realiza el pago para reactivar todos los servicios.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push('/subscription')}
        >
          Reactivar
        </Button>
      </div>
    </div>
  );
}
