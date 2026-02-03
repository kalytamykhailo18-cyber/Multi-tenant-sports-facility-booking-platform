// Database Configuration
// PostgreSQL connection settings via Prisma

import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  logging: process.env.NODE_ENV === 'development',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
