// usePermissions Hook
// Provides role-based permission checking

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  getPermissionsForRole,
  hasPermission as checkPermission,
  canAccessRoute as checkRouteAccess,
  UserRole,
  PermissionConfig,
} from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo<PermissionConfig>(() => {
    if (!user?.role) {
      return getPermissionsForRole('STAFF'); // Default to most restrictive
    }
    return getPermissionsForRole(user.role as UserRole);
  }, [user?.role]);

  const hasPermission = (permission: keyof PermissionConfig): boolean => {
    return checkPermission(user?.role as UserRole, permission);
  };

  const canAccessRoute = (route: string): boolean => {
    return checkRouteAccess(user?.role as UserRole, route);
  };

  const isOwner = user?.role === 'OWNER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isAdminOrOwner = isSuperAdmin || isOwner;

  return {
    permissions,
    hasPermission,
    canAccessRoute,
    isOwner,
    isSuperAdmin,
    isStaff,
    isAdminOrOwner,
    role: user?.role as UserRole | undefined,
  };
}
