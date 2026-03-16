import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type Role = "customer" | "admin";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      role: Role;
    };
  }
}

export async function registerAuthHooks(app: FastifyInstance) {
  // Placeholder auth hook – real implementation will integrate with sessions/JWT.
  app.addHook("preHandler", async (_request: FastifyRequest, _reply: FastifyReply) => {
    // No-op for now; future work will populate request.user from session or token.
  });
}

export function requireRole(role: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || request.user.role !== role) {
      void reply.status(403).send({
        code: "forbidden",
        message: "You do not have permission to perform this action."
      });
    }
  };
}

