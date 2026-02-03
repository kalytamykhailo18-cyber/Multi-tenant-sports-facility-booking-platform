// User related types
// These extend or transform Prisma types for frontend/API use

import type { User, Tenant, UserRole } from '@sports-booking/database';

// User without password hash - safe for API responses
export type SafeUser = Omit<User, 'passwordHash'>;

// Tenant without sensitive data - safe for API responses
export type SafeTenant = Tenant;

// Note: SafeFacility and FacilityWithCredentialStatus are in facility.types.ts

// User for JWT payload
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  tenantId: string | null;
  iat?: number;
  exp?: number;
}

// User for login response
export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: SafeUser;
}

// User for frontend context
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  tenantId: string | null;
  isActive: boolean;
}
