/**
 * Ensures a Better Auth session exists; attaches `session.user` to the request when valid.
 */
import { NextFunction, Request, Response } from 'express';
import { auth } from '../config/auth.js';
import { logger } from '../config/logger.js';

/**
 * @param req - Incoming request (cookies / auth headers forwarded to Better Auth).
 * @param res - Used for `401` when there is no session.
 * @param next - Called when the session is valid.
 */
export const authMiddleware = async(req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
    if (!session) {
        logger.warn('Unauthenticated access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = session.user;
    next();
}