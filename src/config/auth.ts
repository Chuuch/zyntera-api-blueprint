/**
 * Better Auth instance: Drizzle/MySQL adapter, email/password, and URL config.
 *
 * `basePath` must stay in sync with routes (`/api/v1/auth`) and `BETTER_AUTH_URL`.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from '../models/schema.js';
import { db } from "./db.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'mysql',
        schema: schema,
    }),
    emailAndPassword: { enabled: true },
    basePath: '/api/v1/auth',
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
});