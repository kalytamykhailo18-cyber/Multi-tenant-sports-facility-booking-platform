// Auth Hook
// Wraps auth store for component usage
// Components should use this hook, never access store directly

'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore, type User } from '@/stores/auth.store';

export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  // Select state from store
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  // Get actions from store
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);
  const storeCheckAuth = useAuthStore((state) => state.checkAuth);
  const storeClearError = useAuthStore((state) => state.clearError);

  // Wrap actions to maintain reference stability
  const login = useCallback(
    async (email: string, password: string) => {
      await storeLogin(email, password);
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  const checkAuth = useCallback(async () => {
    await storeCheckAuth();
  }, [storeCheckAuth]);

  const clearError = useCallback(() => {
    storeClearError();
  }, [storeClearError]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  };
}

/**
 * Hook to check authentication on mount
 * Use this in layouts/pages that need to verify auth status
 */
export function useAuthCheck(): void {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    // Only check if not already authenticated and not loading
    if (!isAuthenticated && !loading) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, loading]);
}
