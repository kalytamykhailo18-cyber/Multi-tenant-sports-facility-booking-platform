// Database Configuration for Bot Worker
import { PrismaClient } from '@sports-booking/database';
import { logger } from './logger.config';

let prismaClient: PrismaClient | null = null;

export function createDatabaseConnection(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  prismaClient = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [{ level: 'error', emit: 'stdout' }],
  });

  // Log queries in development
  if (process.env.NODE_ENV === 'development') {
    prismaClient.$on('query' as never, (e: any) => {
      logger.debug({ query: e.query, params: e.params }, 'Database query');
    });
  }

  logger.info('✅ Database connected');

  return prismaClient;
}

export function getDatabaseClient(): PrismaClient {
  if (!prismaClient) {
    throw new Error('Database client not initialized. Call createDatabaseConnection() first.');
  }
  return prismaClient;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    logger.info('Database connection closed');
  }
}
