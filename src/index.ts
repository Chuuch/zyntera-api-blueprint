/**
 * Process entry: loads env, creates the HTTP server, and binds to `env.PORT`.
 */
import 'dotenv/config';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createServer } from './server.js';

const app = createServer();

/**
 * Starts listening; logs fatal errors and exits on failure.
 */
const start = async () => {
    try {
        app.listen(env.PORT, () => {
            logger.info(`Server started on port ${env.PORT} [${env.NODE_ENV}]`);
        });
    } catch (error) {
        logger.fatal({ error }, 'Failed to start server');
        process.exit(1);
    }
};

process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection');
});

start();