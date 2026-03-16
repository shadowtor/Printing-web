import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";
const preHandler = [requireAdmin];

const REQUIRED_ENV_VARS = [
  "DATABASE_URL"
  // Add others as needed, e.g. STRIPE_SECRET_KEY when required
];

export async function registerAdminOpsRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/admin/ops/env
   * Validate required env vars (names only; values are not exposed).
   */
  app.get(`${prefix}/ops/env`, { preHandler }, async (_request, reply) => {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
    const present = REQUIRED_ENV_VARS.filter((key) => process.env[key]?.trim());
    return reply.send({
      valid: missing.length === 0,
      required: REQUIRED_ENV_VARS,
      present,
      missing
    });
  });

  /**
   * POST /api/v1/admin/ops/backup
   * Stub: trigger backup (no-op for now).
   */
  app.post(`${prefix}/ops/backup`, { preHandler }, async (_request, reply) => {
    return reply.status(202).send({
      accepted: true,
      message: "Backup trigger not implemented; stub only."
    });
  });
}
