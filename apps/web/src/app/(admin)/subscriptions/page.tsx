// Subscriptions Management Page
// Super Admin page for managing all subscriptions

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import type { Subscription } from '@/lib/subscriptions-api';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { checkStatuses, loading } = useSubscriptions();
  const [checkResult, setCheckResult] = useState<{ updated: number; suspended: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleViewSubscription = (subscription: Subscription) => {
    // Navigate to subscription detail page (future implementation)
    // For now, navigate to the tenant page
    router.push(`/tenants/${subscription.tenantId}`);
  };

  const handleCheckStatuses = async () => {
    setIsChecking(true);
    try {
      const result = await checkStatuses();
      setCheckResult(result);
      // Auto-hide after 5 seconds
      setTimeout(() => setCheckResult(null), 5000);
    } catch (error) {
      console.error('Error checking statuses:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Suscripciones</h1>
            <p className="text-muted-foreground mt-2">
              Administra las suscripciones de todos los tenants
            </p>
          </div>

          {/* Admin utilities */}
          <div className="flex items-center gap-4">
            {checkResult && (
              <div className="text-sm bg-muted px-3 py-2 rounded-md">
                Actualizadas: {checkResult.updated} | Suspendidas: {checkResult.suspended}
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleCheckStatuses}
              disabled={isChecking || loading}
            >
              {isChecking ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Verificando...
                </>
              ) : (
                'Verificar Estados'
              )}
            </Button>
          </div>
        </div>

        {/* Subscription List - no tenantId means show all (for Super Admin) */}
        <SubscriptionList
          onViewSubscription={handleViewSubscription}
          showCreateButton={false}
        />
      </div>
    </ProtectedRoute>
  );
}
