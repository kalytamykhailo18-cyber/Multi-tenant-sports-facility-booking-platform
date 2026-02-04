// Super Admin Dashboard Page
// Platform-wide monitoring and statistics for Super Admin

'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSuperAdminDashboardLoader } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboardPage() {
  const { dashboard, isLoading, error } = useSuperAdminDashboardLoader();
  const router = useRouter();

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Platform-wide monitoring and statistics
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && dashboard && (
          <div className="space-y-6">
            {/* Stats Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Facilities */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.totalFacilities}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.newFacilitiesThisMonth} new this month
                  </p>
                </CardContent>
              </Card>

              {/* Active Subscriptions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dashboard.activeSubscriptions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.suspendedSubscriptions} suspended
                  </p>
                </CardContent>
              </Card>

              {/* Due Soon */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Due Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {dashboard.dueSoonSubscriptions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Within 5 days
                  </p>
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboard.monthlyRevenue.toLocaleString('es-AR')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ARS per month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Due Dates */}
            {dashboard.facilitiesWithUpcomingDue.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Due Dates</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Facilities with payments due in the next 5 days
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.facilitiesWithUpcomingDue.map((facility) => (
                      <div
                        key={facility.facilityId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/super-admin/facilities?search=${facility.facilityName}`)
                        }
                      >
                        <div className="flex-1">
                          <p className="font-medium">{facility.facilityName}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(facility.dueDate).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              facility.daysUntilDue <= 2
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {facility.daysUntilDue} day{facility.daysUntilDue !== 1 ? 's' : ''}
                          </Badge>
                          <p className="font-semibold">
                            ${facility.monthlyPrice.toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => router.push('/super-admin/facilities')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <h3 className="font-semibold mb-1">Manage Facilities</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage all facilities
                    </p>
                  </button>
                  <button
                    onClick={() => router.push('/super-admin/facilities?status=SUSPENDED')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <h3 className="font-semibold mb-1">Suspended Facilities</h3>
                    <p className="text-sm text-muted-foreground">
                      Review suspended subscriptions
                    </p>
                  </button>
                  <button
                    onClick={() => router.push('/super-admin/facilities?subscriptionStatus=DUE_SOON')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <h3 className="font-semibold mb-1">Due Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      Facilities with upcoming payments
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
