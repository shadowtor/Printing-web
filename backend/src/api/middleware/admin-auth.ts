import { requireRole } from "./auth.js";

export const requireAdmin = requireRole("admin");
