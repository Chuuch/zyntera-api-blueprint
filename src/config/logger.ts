/**
 * Application logger (Pino). Pretty-print in non-production; redacts sensitive fields.
 */
import pino from "pino";

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Root logger instance; level from `LOG_LEVEL` or `info`.
 */
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'user.password',
            'user.email',
        ],
        remove: true,
    },
    transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
        },
    } : undefined,
});