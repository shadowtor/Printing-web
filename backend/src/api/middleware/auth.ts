import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { parseCustomerToken } from "../../services/auth-service.js";
import { getCustomerById } from "../../models/customer.js";

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
  app.addHook("preHandler", async (request: FastifyRequest, _reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return;

    if (token.startsWith("admin:")) {
      const secret = token.slice("admin:".length);
      const adminSecret = process.env.ADMIN_SECRET;
      if (adminSecret && secret === adminSecret) {
        request.user = { id: "admin", role: "admin" };
      }
    } else {
      const customerId = parseCustomerToken(token);
      if (customerId) {
        const customer = await getCustomerById(customerId);
        if (customer) {
          request.user = { id: customer.id, role: "customer" };
        }
      }
    }
  });
}

export function requireRole(role: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || request.user.role !== role) {
      return reply.status(403).send({
        code: "forbidden",
        message: "You do not have permission to perform this action."
      });
    }
  };
}

