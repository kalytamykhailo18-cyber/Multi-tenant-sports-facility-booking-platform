// Auth Store (Zustand)
// Manages authentication state, token persistence, and auth operations

import { create } from 'zustand';
import { authApi, ApiError, clearToken, type LoginResponse } from '@/lib/api';
import { socketClient } from '@/lib/socket';

// User type from API response
export type User = LoginResponse['user'];

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// Combined store type
type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Create the auth store
export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  /**
   * Login with email and password
   * Calls API, stores token, and updates user state
   */
  login: async (email: string, password: string) => {
    // Set loading state before API call
    set({ loading: true, error: null });

    try {
      const response = await authApi.login({ email, password });

      // Update state with user data
      set({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      // Connect to WebSocket after successful login
      socketClient.connect();
    } catch (err) {
      // Handle errors - set error state
      const error = err instanceof ApiError
        ? err.message
        : 'Error al iniciar sesión';

      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error,
      });

      throw err;
    }
  },

  /**
   * Logout - clear token and user state
   */
  logout: async () => {
    set({ loading: true, error: null });

    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors - still clear local state
    } finally {
      // Disconnect WebSocket before clearing state
      socketClient.disconnect();

      // Always clear state on logout
      clearToken();
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  },

  /**
   * Check authentication status
   * Verifies token and loads user profile
   */
  checkAuth: async () => {
    // Only check if not already loading
    if (get().loading) return;

    set({ loading: true, error: null });

    try {
      const user = await authApi.getProfile();

      set({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      // Connect to WebSocket after successful auth check
      socketClient.connect();
    } catch {
      // Token invalid or expired - clear state
      clearToken();
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null, // Don't show error for auth check failure
      });
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));
