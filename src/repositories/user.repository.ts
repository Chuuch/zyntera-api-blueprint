/**
 * User persistence via Drizzle (`users` table).
 */
import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { user, type NewUser, type User } from "../models/schema.js";

/**
 * Contract (interface) for loading and creating application users.
 */
export type UserRepository = {
    findById: (id: string) => Promise<User | null>;
    findByEmail: (email: string) => Promise<User | null>;
    create: (data: NewUser) => Promise<User>;
};

/**
 * Default `UserRepository` using the shared `db` client.
 */
export const userRepository: UserRepository = {
    /**
     * @param id - Primary key (`users.id`).
     * @returns Row or `null` if missing.
     */
    async findById(id: string): Promise<User | null> {
        const [result] = await db.select().from(user).where(eq(user.id, id));
        return result || null;
    },

    /**
     * @param email - Unique email address.
     * @returns Row or `null` if not found.
     */
    async findByEmail(email: string): Promise<User | null> {
        const [result] = await db.select().from(user).where(eq(user.email, email));
        return result || null;
    },

    /**
     * @param data - Insert shape (must satisfy table constraints).
     * @returns The inserted row shape (here returned as `User`).
     */
    async create(data: NewUser): Promise<User> {
        await db.insert(user).values(data);
        return data as User;
    }
}