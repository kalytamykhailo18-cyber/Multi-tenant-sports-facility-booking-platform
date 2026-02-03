// API Client
// Singleton API client for all backend requests with interceptors

import type { ApiResponse, ApiErrorResponse, ApiErrorCode } from '@sports-booking/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Token storage key
const TOKEN_KEY = 'auth_token';

// Custom error class for API errors
export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Get stored token
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Set token in storage
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

// Clear token from storage
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Build headers for request
function buildHeaders(customHeaders?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge custom headers
  if (customHeaders) {
    const customHeadersObj = customHeaders instanceof Headers
      ? Object.fromEntries(customHeaders.entries())
      : customHeaders;
    Object.assign(headers, customHeadersObj);
  }

  return headers;
}

// Handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 - redirect to login
  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired', 'TOKEN_EXPIRED', 401);
  }

  // Parse response body
  const data = await response.json();

  // Handle error responses
  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.error?.message || 'An error occurred',
      errorData.error?.code || 'INTERNAL_ERROR',
      response.status,
      errorData.error?.details
    );
  }

  // Return data from successful response
  const successData = data as ApiResponse<T>;
  return successData.data;
}

// Request options type
interface RequestOptions {
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | undefined>;
}

// Build URL with query params
function buildUrl(url: string, params?: RequestOptions['params']): string {
  const fullUrl = `${API_BASE_URL}${url}`;

  if (!params) return fullUrl;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${fullUrl}?${queryString}` : fullUrl;
}

// API client methods
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(buildUrl(url, options?.params), {
      method: 'GET',
      headers: buildHeaders(options?.headers),
    });
    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(buildUrl(url, options?.params), {
      method: 'POST',
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(buildUrl(url, options?.params), {
      method: 'PUT',
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(buildUrl(url, options?.params), {
      method: 'PATCH',
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(buildUrl(url, options?.params), {
      method: 'DELETE',
      headers: buildHeaders(options?.headers),
    });
    return handleResponse<T>(response);
  },
};

// Auth API functions
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    tenantId: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    // Store token after successful login
    setToken(response.accessToken);
    return response;
  },

  /**
   * Logout - clear token
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<{ message: string }>('/auth/logout');
    } finally {
      clearToken();
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<LoginResponse['user']> {
    return apiClient.get<LoginResponse['user']>('/auth/me');
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh');
    setToken(response.accessToken);
    return response;
  },
};
