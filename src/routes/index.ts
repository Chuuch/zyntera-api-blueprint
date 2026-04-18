/**
 * HTTP API v1 routes (mounted under `/api/v1` in `server.ts`).
 */
import { toNodeHandler } from "better-auth/node";
import { Router } from "express";
import { auth } from "../config/auth.js";
import { createAuthController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { userRepository } from "../repositories/user.repository.js";
import { createAuthService } from "../services/user.service.js";

const router = Router();

/**
 * Initialize Auth Layers
 */
const authService = createAuthService(userRepository);
const authController = createAuthController(authService);

/**
 * Auth Routes
 *
 * - `ALL /auth/*` — Better Auth handler (sessions, credentials, etc.).
 * - `GET /me` — current user; requires a valid session cookie / headers.
 */
router.all('/auth/*path', toNodeHandler(auth));
router.get('/me', authMiddleware, authController.getMe);

export default router;