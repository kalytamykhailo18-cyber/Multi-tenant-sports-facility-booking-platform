// Admin Layout - Super Admin pages only
// Protected with SUPER_ADMIN role requirement

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';
import { LogOut, User, Building, CreditCard, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <AdminContent>{children}</AdminContent>
    </ProtectedRoute>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                Sports Booking - Admin
              </h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.fullName}</span>
                  <span className="text-xs bg-amber-500 text-black px-2 py-1 rounded">
                    SUPER ADMIN
                  </span>
                </div>
              )}

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1 text-white hover:text-gray-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 text-white min-h-[calc(100vh-73px)] hidden md:block">
          <nav className="p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-slate-700"
              onClick={() => navigateTo('/admin')}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-slate-700"
              onClick={() => navigateTo('/admin/facilities')}
            >
              <Building className="h-4 w-4 mr-2" />
              Establecimientos
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-slate-700"
              onClick={() => navigateTo('/admin/subscriptions')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Suscripciones
            </Button>
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
