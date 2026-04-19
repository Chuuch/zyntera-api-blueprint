import type { AuthUser } from "../config/auth.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export { };
