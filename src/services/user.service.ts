import type { AuthSession } from "../config/auth.js";
/**
 * Auth domain service: wraps Better Auth session API and `UserRepository`.
 */
import { auth } from "../config/auth.js";
import { NewUser, User } from "../models/schema.js";
import { UserRepository } from "../repositories/user.repository.js";

/**
 * Session and user persistence operations used by controllers.
 */
export type AuthService = {
    getSession: (headers: Headers) => Promise<AuthSession | null>;
    getUserByEmail: (email: string) => Promise<User | null>;
    createUser: (data: NewUser) => Promise<User>;
}

/**
 * @param repo - Data access for users.
 * @returns `AuthService` implementation.
 */
export const createAuthService = (repo: UserRepository): AuthService => ({
    getSession: async (headers: Headers) => await auth.api.getSession({ headers: headers as HeadersInit }),
    getUserByEmail: async (email: string) => await repo.findByEmail(email),
    createUser: async (data: NewUser) => await repo.create(data),
});