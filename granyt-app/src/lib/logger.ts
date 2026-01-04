import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

/**
 * Configures the pino logger.
 * On Windows with Next.js Turbopack, pino transports (which use worker threads) 
 * can fail with "MODULE_NOT_FOUND" or "worker has exited".
 * We use pino-pretty as a stream in development to avoid these issues.
 */
const createLoggerInstance = () => {
  const options: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    browser: {
      asObject: true,
    },
  };

  if (isDev && isServer) {
    try {
      // Use eval('require') to prevent Webpack from bundling pino-pretty in the client
      // and to avoid the "Critical dependency" warning.
      // This is necessary for Windows compatibility with Next.js Turbopack.
      const req = eval('require');
      const pretty = req('pino-pretty');
      return pino(options, pretty({
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      }));
    } catch {
      // Fallback if pino-pretty is not available
      return pino(options);
    }
  }

  return pino(options);
};

export const logger = createLoggerInstance();

/**
 * Creates a child logger with a specific context
 * @param context The context name (e.g., 'EmailService', 'Auth')
 */
export const createLogger = (context: string) => logger.child({ context });
