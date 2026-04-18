/**
 * Drizzle table definitions and inferred row types for MySQL.
 *
 * Used by Better Auth (adapter) and app repositories.
 */
import { boolean, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { InferInsertModel, InferSelectModel } from "drizzle-orm";

/** Selected row from `users`. */
export type User = InferSelectModel<typeof user>;
/** Insert payload for `users`. */
export type NewUser = InferInsertModel<typeof user>;

/** Application users (Better Auth–compatible fields). */
export const user = mysqlTable('users', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    role: mysqlEnum('role', ['admin', 'user']).notNull().default('user'),
});

/** Better Auth session storage. */
export const session = mysqlTable('sessions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id),
    token: varchar('token', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    expiresAt: timestamp('expires_at').notNull().defaultNow(),
    ipAddress: text('ip_address').notNull(),
    userAgent: text('user_agent').notNull(),
});

/** Linked OAuth / credential accounts per user (Better Auth). */
export const account = mysqlTable('accounts', {
    id: varchar('id', { length: 36 }).primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expiers_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});