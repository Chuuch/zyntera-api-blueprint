/**
 * Validated process environment. Exits the process on parse failure at import time.
 */
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.url(),
    DB_HOST: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    DB_ROOT_PASSWORD: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    BETTER_AUTH_SECRET: z.string().min(32),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('Invalid environment variables:', z.treeifyError(_env.error));
    process.exit(1);
}

/**
 * Strongly typed env vars after Zod validation.
 */
export const env = _env.data;