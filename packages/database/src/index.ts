// Database package main export
// Re-exports Prisma client and generated types

// Re-export Prisma client
import { PrismaClient } from '@prisma/client';

// Global singleton pattern for Prisma client
// Prevents multiple instances during development with hot reload
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  });
};

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export { PrismaClient };

// Re-export all Prisma generated types
export type {
  Tenant,
  User,
  Facility,
  Court,
  Subscription,
  Prisma,
} from '@prisma/client';

// Re-export enums
export {
  UserRole,
  TenantStatus,
  FacilityStatus,
  CourtStatus,
  SportType,
  SubscriptionStatus,
  BillingCycle,
} from '@prisma/client';
