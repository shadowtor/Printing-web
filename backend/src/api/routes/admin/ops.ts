import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";
const preHandler = [requireAdmin];

const REQUIRED_ENV_VARS = ["DATABASE_URL"];

export async function registerAdminOpsRoutes(app: FastifyInstance) {
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

  app.post(`${prefix}/ops/backup`, { preHandler }, async (_request, reply) => {
    return reply.status(202).send({
      accepted: true,
      message: "Backup trigger not implemented; stub only."
    });
  });
}
