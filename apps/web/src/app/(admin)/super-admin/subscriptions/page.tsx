// Super Admin Subscriptions Page
// Manage all subscriptions across the platform

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SubscriptionStatus, Subscription } from '@/lib/subscriptions-api';

export default function SuperAdminSubscriptionsPage() {
  const router = useRouter();
  const {
    subscriptions,
    pagination,
    loading,
    suspending,
    reactivating,
    cancelling,
    error,
    loadSubscriptions,
    suspend,
    reactivate,
    cancel,
    checkStatuses,
    clearError,
  } = useSubscriptions();

  // Query state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('' );
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'nextPaymentDate' | 'createdAt' | 'priceAmount'>('nextPaymentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'reactivate' | 'cancel' | null;
    subscription: Subscription | null;
    reason: string;
  }>({
    isOpen: false,
    type: null,
    subscription: null,
    reason: '',
  });

  // Load subscriptions when params change
  useEffect(() => {
    loadSubscriptions({
      page,
      limit: 10,
      status: statusFilter || undefined,
      sortBy,
      sortOrder,
    });
  }, [statusFilter, page, sortBy, sortOrder, loadSubscriptions]);

  const handleAction = async () => {
    if (!actionModal.subscription) return;

    try {
      if (actionModal.type === 'suspend') {
        await suspend(actionModal.subscription.id, actionModal.reason || 'Manual suspension by Super Admin');
      } else if (actionModal.type === 'reactivate') {
        await reactivate(actionModal.subscription.id);
      } else if (actionModal.type === 'cancel') {
        await cancel(actionModal.subscription.id, actionModal.reason || 'Manual cancellation by Super Admin');
      }

      // Reload subscriptions after action
      loadSubscriptions({ page, limit: 10, status: statusFilter || undefined, sortBy, sortOrder });

      // Close modal
      setActionModal({ isOpen: false, type: null, subscription: null, reason: '' });
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleCheckStatuses = async () => {
    try {
      const result = await checkStatuses();
      alert(`Status check complete:\n${result.updated} updated to DUE_SOON\n${result.suspended} suspended`);
      loadSubscriptions({ page, limit: 10, status: statusFilter || undefined, sortBy, sortOrder });
    } catch (error) {
      // Error handled by store
    }
  };

  const getStatusBadgeVariant = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'DUE_SOON':
        return 'secondary';
      case 'OVERDUE':
        return 'destructive';
      case 'SUSPENDED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Subscription Management</h1>
              <p className="text-muted-foreground mt-2">
                Monitor and manage all facility subscriptions
              </p>
            </div>
            <Button onClick={handleCheckStatuses} variant="outline">
              Check Statuses
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DUE_SOON">Due Soon</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium mb-2">
                  Sort By
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="nextPaymentDate">Next Payment Date</option>
                  <option value="createdAt">Created Date</option>
                  <option value="priceAmount">Price</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium mb-2">
                  Sort Order
                </label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-700 hover:text-red-900">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Subscriptions ({pagination.total})</CardTitle>
              {loading && <Spinner />}
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {loading && subscriptions.length === 0 && (
              <div className="flex justify-center items-center h-32">
                <Spinner />
              </div>
            )}

            {/* No Results */}
            {!loading && subscriptions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No subscriptions found
              </div>
            )}

            {/* Subscriptions Table */}
            {subscriptions.length > 0 && (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Tenant</th>
                        <th className="text-left py-3 px-2">Plan</th>
                        <th className="text-left py-3 px-2">Price</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Next Payment</th>
                        <th className="text-left py-3 px-2">Days Until Due</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{subscription.tenantName || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{subscription.tenantId}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">{subscription.planName}</td>
                          <td className="py-3 px-2">
                            {subscription.priceAmount.toLocaleString('es-AR')} {subscription.currency}
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={getStatusBadgeVariant(subscription.status)}>
                              {subscription.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            {new Date(subscription.nextPaymentDate).toLocaleDateString('es-AR')}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={
                                subscription.daysUntilDue <= 0
                                  ? 'text-red-600 font-semibold'
                                  : subscription.daysUntilDue <= 5
                                  ? 'text-yellow-600'
                                  : ''
                              }
                            >
                              {subscription.daysUntilDue} days
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              {subscription.status === 'ACTIVE' || subscription.status === 'DUE_SOON' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      type: 'suspend',
                                      subscription,
                                      reason: '',
                                    })
                                  }
                                >
                                  Suspend
                                </Button>
                              ) : subscription.status === 'SUSPENDED' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      type: 'reactivate',
                                      subscription,
                                      reason: '',
                                    })
                                  }
                                >
                                  Reactivate
                                </Button>
                              ) : null}

                              {subscription.status !== 'CANCELLED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      type: 'cancel',
                                      subscription,
                                      reason: '',
                                    })
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{subscription.tenantName || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{subscription.planName}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Price:</span>{' '}
                          {subscription.priceAmount.toLocaleString('es-AR')} {subscription.currency}
                        </p>
                        <p>
                          <span className="font-medium">Next Payment:</span>{' '}
                          {new Date(subscription.nextPaymentDate).toLocaleDateString('es-AR')}
                        </p>
                        <p>
                          <span className="font-medium">Days Until Due:</span>{' '}
                          <span
                            className={
                              subscription.daysUntilDue <= 0
                                ? 'text-red-600 font-semibold'
                                : subscription.daysUntilDue <= 5
                                ? 'text-yellow-600'
                                : ''
                            }
                          >
                            {subscription.daysUntilDue} days
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {subscription.status === 'ACTIVE' || subscription.status === 'DUE_SOON' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: 'suspend',
                                subscription,
                                reason: '',
                              })
                            }
                          >
                            Suspend
                          </Button>
                        ) : subscription.status === 'SUSPENDED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: 'reactivate',
                                subscription,
                                reason: '',
                              })
                            }
                          >
                            Reactivate
                          </Button>
                        ) : null}

                        {subscription.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: 'cancel',
                                subscription,
                                reason: '',
                              })
                            }
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={pagination.page === 1}
                        onClick={() => setPage(pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPage(pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Modal */}
        <Dialog
          open={actionModal.isOpen}
          onClose={() => setActionModal({ isOpen: false, type: null, subscription: null, reason: '' })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionModal.type === 'suspend' && 'Suspend Subscription'}
                {actionModal.type === 'reactivate' && 'Reactivate Subscription'}
                {actionModal.type === 'cancel' && 'Cancel Subscription'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                {actionModal.type === 'suspend' &&
                  'This will suspend the subscription and tenant immediately. The facility will not be able to access the system.'}
                {actionModal.type === 'reactivate' &&
                  'This will reactivate the subscription and extend it for 30 days from today.'}
                {actionModal.type === 'cancel' &&
                  'This will permanently cancel the subscription. This action cannot be undone.'}
              </p>

              {(actionModal.type === 'suspend' || actionModal.type === 'cancel') && (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium mb-2">
                    Reason (Optional)
                  </label>
                  <Input
                    id="reason"
                    value={actionModal.reason}
                    onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                    placeholder="Enter reason..."
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ isOpen: false, type: null, subscription: null, reason: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={suspending || reactivating || cancelling}
                >
                  {(suspending || reactivating || cancelling) && <Spinner />}
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
