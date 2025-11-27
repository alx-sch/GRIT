import pino from 'pino';

// Check if we are in development mode
const isDev = process.env.NODE_ENV === 'development';

const logger = pino({
  // Only use pino-pretty if in development -> human-readable logs
  ...(isDev ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    } : {})
});

const info = (msg: string, data?: object) => logger.info(data, msg);
const warn = (msg: string, data?: object) => logger.warn(data, msg);
const error = (msg: string, data?: object) => logger.error(data, msg);
const debug = (msg: string, data?: object) => logger.debug(data, msg);

export { logger, info, warn, error, debug };
