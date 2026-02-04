// Dashboard Layout - Protected pages with sidebar
// Wraps all dashboard pages with authentication check and common UI

'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import {
  FiLogOut,
  FiUser,
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiSettings,
  FiGrid,
  FiTarget
} from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardContent>{children}</DashboardContent>
    </ProtectedRoute>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { permissions, isStaff, isAdminOrOwner } = usePermissions();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">
                Sports Booking
              </h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiUser className="h-4 w-4" />
                  <span>{user.fullName}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {user.role}
                  </span>
                </div>
              )}

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <FiLogOut className="h-4 w-4" />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-73px)] hidden md:block animate-fade-left-fast">
          <nav className="p-4 space-y-1">
            {/* Dashboard - Everyone can access */}
            {permissions.canViewDashboard && (
              <Button
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/dashboard') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/dashboard')}
              >
                <FiHome className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}

            {/* Calendar - Everyone can access */}
            {permissions.canViewBookings && (
              <Button
                variant={isActive('/calendar') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/calendar') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/calendar')}
              >
                <FiCalendar className="h-4 w-4 mr-2" />
                Calendario
              </Button>
            )}

            {/* Customers - Everyone can access */}
            {permissions.canViewCustomers && (
              <Button
                variant={isActive('/customers') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/customers') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/customers')}
              >
                <FiUsers className="h-4 w-4 mr-2" />
                Clientes
              </Button>
            )}

            {/* Find a Rival - Everyone can access */}
            {permissions.canViewBookings && (
              <Button
                variant={isActive('/find-rival') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/find-rival') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/find-rival')}
              >
                <FiTarget className="h-4 w-4 mr-2" />
                Buscar Rival
              </Button>
            )}

            {/* Finances - OWNER and SUPER_ADMIN only */}
            {permissions.canViewFinances && (
              <Button
                variant={isActive('/finances') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/finances') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/finances')}
              >
                <FiDollarSign className="h-4 w-4 mr-2" />
                Finanzas
              </Button>
            )}

            {/* Courts - OWNER and SUPER_ADMIN only */}
            {permissions.canManageCourts && (
              <Button
                variant={isActive('/courts') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/courts') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/courts')}
              >
                <FiGrid className="h-4 w-4 mr-2" />
                Canchas
              </Button>
            )}

            {/* Settings - OWNER and SUPER_ADMIN only */}
            {permissions.canEditFacilitySettings && (
              <Button
                variant={isActive('/settings') ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-md',
                  isActive('/settings') && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigateTo('/settings')}
              >
                <FiSettings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            )}

            {/* Role indicator for staff */}
            {isStaff && (
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md animate-fade-up-slow">
                <p className="text-xs text-blue-800 font-medium">
                  Acceso de Personal
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Acceso limitado a funciones operativas
                </p>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
