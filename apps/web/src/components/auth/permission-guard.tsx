// Permission Guard Component
// Wraps content that requires specific permissions

'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from './access-denied';
import { PermissionConfig } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission: keyof PermissionConfig;
  fallback?: ReactNode;
  requiredRole?: string;
}

export function PermissionGuard({
  children,
  permission,
  fallback,
  requiredRole,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDenied
        title="Acceso Restringido"
        message="No tienes permisos para acceder a esta funcionalidad."
        requiredRole={requiredRole}
      />
    );
  }

  return <>{children}</>;
}
