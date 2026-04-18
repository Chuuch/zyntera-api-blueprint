/**
 * HTTP handlers for authenticated user resources.
 */
import { Request, Response } from 'express';
import { AuthService } from '../services/user.service.js';

/**
 * Factory for auth-related controllers backed by `AuthService`.
 *
 * @param service - Session and user operations.
 * @returns Object with route handlers (e.g. `getMe`).
 */
export const createAuthController = (service: AuthService) => ({
    /**
     * Returns the current Better Auth session payload as JSON, or `401` / `500`.
     *
     * @param req - Express request; headers forwarded to `getSession`.
     * @param res - JSON session or error body.
     */
    getMe: async (req: Request, res: Response) => {
        try {
            const headers = new Headers(req.headers as any);
            const session = await service.getSession(headers);

            if (!session) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            return res.json(session);
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});