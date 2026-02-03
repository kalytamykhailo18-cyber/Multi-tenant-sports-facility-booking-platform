// Dashboard Alerts List Component
// Displays alerts requiring attention

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { DashboardAlert, AlertPriority, AlertType } from '@/lib/dashboard-api';

interface AlertsListProps {
  alerts: DashboardAlert[];
  loading?: boolean;
  maxItems?: number;
}

const priorityConfig: Record<AlertPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  URGENT: { label: 'Urgente', variant: 'destructive' },
  HIGH: { label: 'Alta', variant: 'destructive' },
  MEDIUM: { label: 'Media', variant: 'secondary' },
  LOW: { label: 'Baja', variant: 'outline' },
};

const typeConfig: Record<AlertType, { icon: string }> = {
  UNCONFIRMED_BOOKING: { icon: '📅' },
  PENDING_ESCALATION: { icon: '💬' },
  PAYMENT_ISSUE: { icon: '💳' },
  SUBSCRIPTION_REMINDER: { icon: '📢' },
  NO_SHOW_RISK: { icon: '⚠️' },
};

export function AlertsList({ alerts, loading, maxItems = 5 }: AlertsListProps) {
  const router = useRouter();

  const handleAlertClick = (alert: DashboardAlert) => {
    if (alert.actionLink) {
      router.push(alert.actionLink);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
          <CardDescription>Acciones que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
          <CardDescription>Acciones que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-lg mb-2">Todo en orden</p>
            <p className="text-sm">No hay alertas pendientes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedAlerts = alerts.slice(0, maxItems);
  const remainingCount = alerts.length - maxItems;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Acciones que requieren atención</CardDescription>
          </div>
          {alerts.length > 0 && (
            <Badge variant="secondary">{alerts.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onClick={() => handleAlertClick(alert)}
          />
        ))}
        {remainingCount > 0 && (
          <Button variant="ghost" className="w-full text-sm">
            Ver {remainingCount} más
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: DashboardAlert;
  onClick?: () => void;
}

function AlertItem({ alert, onClick }: AlertItemProps) {
  const priority = priorityConfig[alert.priority];
  const type = typeConfig[alert.type];

  return (
    <div
      className={`p-3 rounded-lg border ${
        alert.priority === 'URGENT' ? 'border-destructive bg-destructive/5' :
        alert.priority === 'HIGH' ? 'border-yellow-500 bg-yellow-500/5' :
        'border-border'
      } ${onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{type.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{alert.title}</p>
            <Badge variant={priority.variant} className="text-xs shrink-0">
              {priority.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {alert.description}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AlertsBannerProps {
  alerts: DashboardAlert[];
}

export function AlertsBanner({ alerts }: AlertsBannerProps) {
  const urgentAlerts = alerts.filter(a => a.priority === 'URGENT');
  const router = useRouter();

  if (urgentAlerts.length === 0) {
    return null;
  }

  const alert = urgentAlerts[0];

  return (
    <div
      className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive cursor-pointer hover:bg-destructive/15 transition-colors"
      onClick={() => alert.actionLink && router.push(alert.actionLink)}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{typeConfig[alert.type].icon}</span>
        <div className="flex-1">
          <p className="font-semibold">{alert.title}</p>
          <p className="text-sm opacity-90">{alert.description}</p>
        </div>
        <Button variant="destructive" size="sm">
          Ver
        </Button>
      </div>
    </div>
  );
}
