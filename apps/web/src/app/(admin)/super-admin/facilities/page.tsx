// Super Admin Facilities Page
// Manage all facilities across the platform

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import type { FacilityQueryParams, SubscriptionStatus, FacilityStatus } from '@/lib/super-admin-api';

export default function SuperAdminFacilitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    facilities,
    facilitiesTotal,
    facilitiesPage,
    facilitiesLimit,
    facilitiesTotalPages,
    loadingFacilities,
    error,
    loadFacilities,
  } = useSuperAdmin();

  // Query state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | ''>(
    (searchParams.get('subscriptionStatus') as SubscriptionStatus) || ''
  );
  const [status, setStatus] = useState<FacilityStatus | ''>(
    (searchParams.get('status') as FacilityStatus) || ''
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'nextDueDate'>(
    (searchParams.get('sortBy') as any) || 'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as any) || 'desc'
  );

  // Load facilities when params change
  useEffect(() => {
    const params: FacilityQueryParams = {
      page,
      limit: 10,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (subscriptionStatus) params.subscriptionStatus = subscriptionStatus;
    if (status) params.status = status;

    loadFacilities(params);
  }, [search, subscriptionStatus, status, page, sortBy, sortOrder, loadFacilities]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  // Handle filter reset
  const handleReset = () => {
    setSearch('');
    setSubscriptionStatus('');
    setStatus('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
    router.push('/super-admin/facilities');
  };

  // Get status badge variant
  const getSubscriptionBadgeVariant = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'DUE_SOON':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getFacilityBadgeVariant = (status: FacilityStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Facilities Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all facilities across the platform
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Input */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium mb-2">
                  Search by name or city
                </label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Search facilities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filters Row */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Subscription Status Filter */}
                <div>
                  <label htmlFor="subscription-status" className="block text-sm font-medium mb-2">
                    Subscription Status
                  </label>
                  <select
                    id="subscription-status"
                    value={subscriptionStatus}
                    onChange={(e) => setSubscriptionStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DUE_SOON">Due Soon</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                {/* Facility Status Filter */}
                <div>
                  <label htmlFor="facility-status" className="block text-sm font-medium mb-2">
                    Facility Status
                  </label>
                  <select
                    id="facility-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label htmlFor="sort-by" className="block text-sm font-medium mb-2">
                    Sort By
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="name">Name</option>
                    <option value="createdAt">Created Date</option>
                    <option value="nextDueDate">Next Due Date</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label htmlFor="sort-order" className="block text-sm font-medium mb-2">
                    Sort Order
                  </label>
                  <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button type="submit">Apply Filters</Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Results Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Facilities ({facilitiesTotal})
              </CardTitle>
              {loadingFacilities && <Spinner />}
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {loadingFacilities && facilities.length === 0 && (
              <div className="flex justify-center items-center h-32">
                <Spinner />
              </div>
            )}

            {/* No Results */}
            {!loadingFacilities && facilities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No facilities found matching your criteria
              </div>
            )}

            {/* Facilities Table */}
            {facilities.length > 0 && (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Facility</th>
                        <th className="text-left py-3 px-2">Owner</th>
                        <th className="text-left py-3 px-2">Courts</th>
                        <th className="text-left py-3 px-2">Subscription</th>
                        <th className="text-left py-3 px-2">Next Due</th>
                        <th className="text-left py-3 px-2">Monthly Price</th>
                        <th className="text-left py-3 px-2">Connections</th>
                        <th className="text-left py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facilities.map((facility) => (
                        <tr key={facility.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{facility.name}</p>
                              <p className="text-sm text-muted-foreground">{facility.city}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="text-sm">{facility.ownerName}</p>
                              <p className="text-xs text-muted-foreground">{facility.ownerEmail}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">{facility.courtCount}</td>
                          <td className="py-3 px-2">
                            <Badge variant={getSubscriptionBadgeVariant(facility.subscriptionStatus)}>
                              {facility.subscriptionStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            {facility.nextDueDate
                              ? new Date(facility.nextDueDate).toLocaleDateString('es-AR')
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-2">
                            ${facility.monthlyPrice.toLocaleString('es-AR')}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              {facility.whatsappConnected && (
                                <Badge variant="outline" className="text-xs">WA</Badge>
                              )}
                              {facility.mercadoPagoConnected && (
                                <Badge variant="outline" className="text-xs">MP</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={getFacilityBadgeVariant(facility.status)}>
                              {facility.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {facilities.map((facility) => (
                    <div key={facility.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{facility.name}</p>
                          <p className="text-sm text-muted-foreground">{facility.city}</p>
                        </div>
                        <Badge variant={getFacilityBadgeVariant(facility.status)}>
                          {facility.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Owner:</span> {facility.ownerName}
                        </p>
                        <p>
                          <span className="font-medium">Courts:</span> {facility.courtCount}
                        </p>
                        <p>
                          <span className="font-medium">Subscription:</span>{' '}
                          <Badge variant={getSubscriptionBadgeVariant(facility.subscriptionStatus)} className="ml-1">
                            {facility.subscriptionStatus}
                          </Badge>
                        </p>
                        <p>
                          <span className="font-medium">Monthly:</span> $
                          {facility.monthlyPrice.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {facilitiesTotalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {facilitiesPage} of {facilitiesTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={facilitiesPage === 1}
                        onClick={() => setPage(facilitiesPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={facilitiesPage === facilitiesTotalPages}
                        onClick={() => setPage(facilitiesPage + 1)}
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
      </div>
    </ProtectedRoute>
  );
}
