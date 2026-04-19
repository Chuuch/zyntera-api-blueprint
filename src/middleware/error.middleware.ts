/**
 * Express error-handling middleware: logs the error and returns a JSON error body.
 */
import { NextFunction, Request, Response } from 'express';

/**
 * @param err - Thrown error or `{ status, statusCode, message, code }`-shaped object.
 * @param req - Request being handled (logged for context).
 * @param res - Response; status from `err` or `500`.
 * @param next - Unused (signature required by Express).
 */
export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const statusCode = err instanceof Error ? 500 :
    (err as { status?: number; statusCode?: number }).status ||
    (err as { status?: number; statusCode?: number }).statusCode || 500;

    res.status(statusCode).json({
        success: false,
        error: {
            message: statusCode === 500 ? 'Internal Server Error' : (err as Error).message,
            code: (err as unknown as { code?: string }).code || 'INTERNAL_ERROR',
        },
    });
}