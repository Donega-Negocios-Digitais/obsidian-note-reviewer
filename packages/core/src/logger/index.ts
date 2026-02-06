/**
 * Logger Configuration
 *
 * Structured logging using Pino for production-ready logging.
 */

import pino from 'pino';

const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.VITEST;

/**
 * Pino logger configuration
 */
export const logger = pino({
  level: isDevelopment ? 'debug' : isTest ? 'silent' : 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  browser: {
    asObject: true,
  },
  // Development: use pino-pretty for readable output
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss',
        singleLine: false,
      },
    },
  }),
  // Production: JSON for log aggregation
  ...(!isDevelopment && {
    formatters: {
      log(object) {
        return {
          ...object,
          time: new Date().toISOString(),
        };
      },
    },
  }),
});

/**
 * Type-safe logging methods
 */
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  fatal: logger.fatal.bind(logger),
};

/**
 * Create a scoped logger for a specific component
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, data?: unknown) =>
      logger.debug({ component }, message, data),
    info: (message: string, data?: unknown) =>
      logger.info({ component }, message, data),
    warn: (message: string, data?: unknown) =>
      logger.warn({ component }, message, data),
    error: (message: string, error?: Error | unknown) => {
      if (error instanceof Error) {
        logger.error(
          {
            component,
            error: error.message,
            stack: error.stack,
          },
          message
        );
      } else {
        logger.error({ component, data: error }, message);
      }
    },
    fatal: (message: string, error?: Error | unknown) => {
      if (error instanceof Error) {
        logger.fatal(
          {
            component,
            error: error.message,
            stack: error.stack,
          },
          message
        );
      } else {
        logger.fatal({ component, data: error }, message);
      }
    },
  };
}

export default logger;
