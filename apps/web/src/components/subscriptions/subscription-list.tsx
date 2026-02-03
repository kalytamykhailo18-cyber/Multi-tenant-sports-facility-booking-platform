// Subscription List Component
// Displays paginated list of subscriptions with filters

'use client';

import { useState, useEffect } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionCard } from './subscription-card';
import { SubscriptionForm } from './subscription-form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Subscription, QuerySubscriptionParams, CreateSubscriptionRequest, UpdateSubscriptionRequest, SubscriptionStatus } from '@/lib/subscriptions-api';

interface SubscriptionListProps {
  tenantId?: string;
  tenantName?: string;
  onViewSubscription?: (subscription: Subscription) => void;
  showCreateButton?: boolean;
}

export function SubscriptionList({
  tenantId,
  tenantName,
  onViewSubscription,
  showCreateButton = true,
}: SubscriptionListProps) {
  const {
    subscriptions,
    pagination,
    loading,
    creating,
    updating,
    suspending,
    reactivating,
    cancelling,
    error,
    loadSubscriptions,
    create,
    update,
    suspend,
    reactivate,
    cancel,
    clearError,
  } = useSubscriptions();

  // Local state for filters
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Load subscriptions on mount and when filters change
  useEffect(() => {
    loadSubscriptions({
      page: currentPage,
      limit: 10,
      status: statusFilter,
      tenantId,
    });
  }, [loadSubscriptions, currentPage, statusFilter, tenantId]);

  // Handlers
  const handleStatusFilterChange = (status: SubscriptionStatus | undefined) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCreateSubmit = async (data: CreateSubscriptionRequest | UpdateSubscriptionRequest) => {
    await create(data as CreateSubscriptionRequest);
    setShowCreateModal(false);
  };

  const handleEditSubmit = async (data: CreateSubscriptionRequest | UpdateSubscriptionRequest) => {
    if (editingSubscription) {
      await update(editingSubscription.id, data as UpdateSubscriptionRequest);
      setEditingSubscription(null);
    }
  };

  const handleSuspend = async (subscription: Subscription) => {
    const reason = prompt('Razón de la suspensión (opcional):');
    if (confirm(`¿Estás seguro de suspender la suscripción de "${subscription.tenantName || subscription.planName}"?`)) {
      await suspend(subscription.id, reason || undefined);
    }
  };

  const handleReactivate = async (subscription: Subscription) => {
    if (confirm(`¿Estás seguro de reactivar la suscripción de "${subscription.tenantName || subscription.planName}"?`)) {
      await reactivate(subscription.id);
    }
  };

  const handleCancel = async (subscription: Subscription) => {
    const reason = prompt('Razón de la cancelación (opcional):');
    if (confirm(`¿Estás seguro de cancelar la suscripción de "${subscription.tenantName || subscription.planName}"? Esta acción puede ser irreversible.`)) {
      await cancel(subscription.id, reason || undefined);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isProcessing = suspending || reactivating || cancelling;

  return (
    <div className="space-y-6">
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange(undefined)}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('ACTIVE')}
          >
            Activas
          </Button>
          <Button
            variant={statusFilter === 'DUE_SOON' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('DUE_SOON')}
          >
            Por vencer
          </Button>
          <Button
            variant={statusFilter === 'OVERDUE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('OVERDUE')}
          >
            Vencidas
          </Button>
          <Button
            variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('SUSPENDED')}
          >
            Suspendidas
          </Button>
          <Button
            variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('CANCELLED')}
          >
            Canceladas
          </Button>
        </div>

        {/* Create button */}
        {showCreateButton && tenantId && (
          <Button onClick={() => setShowCreateModal(true)} disabled={isProcessing}>
            Nueva Suscripción
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Cerrar
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Subscription grid */}
      {!loading && subscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onView={onViewSubscription}
              onEdit={(s) => setEditingSubscription(s)}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && subscriptions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {statusFilter
              ? 'No se encontraron suscripciones con los filtros aplicados'
              : 'No hay suscripciones registradas'}
          </p>
          {!statusFilter && tenantId && showCreateButton && (
            <Button
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Crear primera suscripción
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm">
            Página {currentPage} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && tenantId && (
        <SubscriptionForm
          tenantId={tenantId}
          tenantName={tenantName}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={creating}
        />
      )}

      {/* Edit Modal */}
      {editingSubscription && (
        <SubscriptionForm
          subscription={editingSubscription}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingSubscription(null)}
          isSubmitting={updating}
        />
      )}
    </div>
  );
}
