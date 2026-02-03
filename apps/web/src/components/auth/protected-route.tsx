// Protected Route Wrapper
// Checks authentication and redirects to login if not authenticated
// Use this to wrap protected pages/layouts

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles for access (optional - if not specified, any authenticated user can access) */
  requiredRoles?: string[];
  /** Fallback component to show while loading (optional) */
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Check role requirements
  const hasRequiredRole = () => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    if (!user) {
      return false;
    }
    return requiredRoles.includes(user.role);
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      )
    );
  }

  // Not authenticated - redirecting (don't render children)
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      )
    );
  }

  // Check role requirements
  if (!hasRequiredRole()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="mt-2 text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
}
