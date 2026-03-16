import type { FastifyInstance } from "fastify";
import prisma from "../../db/client.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", checks: { db: "ok" } };
    } catch {
      return { status: "degraded", checks: { db: "error" } };
    }
  });
}

