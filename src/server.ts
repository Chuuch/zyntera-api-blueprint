/**
 * Express application factory: middleware stack and `/api/v1` API mounting.
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/index.js';

/**
 * Creates a configured Express app (no `listen`).
 *
 * @returns Express instance with `/api/v1`, `/health`, and global error handling.
 */
export const createServer = () => {
    const app = express();

    app.use(helmet());
    app.use(cors({
        origin: env.NODE_ENV === 'production' ?
            'https://express-drizzle-blueprint.com' :
            'http://localhost:5173',
        credentials: true,
    }));

    app.use(express.json({ limit: '10kb' }));
    app.use(pinoHttp({ logger }));

    app.use('/api/v1', apiRouter);

    // Health check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    app.use(errorHandler);

    return app;
}