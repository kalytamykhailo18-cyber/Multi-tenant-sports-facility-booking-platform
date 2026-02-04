// Logger Configuration using Pino
import pino from 'pino';
import { envConfig } from './env.config';

export const logger = pino({
  level: envConfig.LOG_LEVEL,
  transport:
    envConfig.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});

export type Logger = typeof logger;
