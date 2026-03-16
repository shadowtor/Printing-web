import { requireRole } from "./auth.js";

/**
 * PreHandler that requires request.user to have role "admin".
 * Use on all /api/v1/admin/* routes.
 */
export const requireAdmin = requireRole("admin");
