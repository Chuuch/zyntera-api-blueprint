/**
 * Express error-handling middleware: logs the error and returns a JSON error body.
 */
import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

/**
 * @param err - Thrown error or `{ status, statusCode, message, code }`-shaped object.
 * @param req - Request being handled (logged for context).
 * @param res - Response; status from `err` or `500`.
 * @param next - Unused (signature required by Express).
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const statusCode = err.status || err.statusCode || 500;

    logger.error({
        err,
        method: req.method,
        url: req.url,
        body: req.body,
    }, 'Unhandled Application Error');

    res.status(statusCode as number).json({
        success: false,
        error: {
            message: statusCode === 500 ? 'Internal Server Error' : err.message,
            code: err.code || 'INTERNAL_ERROR',
        },
    });
}