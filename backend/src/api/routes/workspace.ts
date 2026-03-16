import type { FastifyInstance } from "fastify";
import {
  getWorkspaceByOrderId,
  addComment,
  WorkspaceServiceError
} from "../../services/workspace-service.js";
import { requireRole } from "../middleware/auth.js";

export async function registerWorkspaceRoutes(app: FastifyInstance) {
  const requireCustomer = requireRole("customer");

  app.get<{ Params: { orderId: string } }>(
    "/api/v1/orders/:orderId/workspace",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      const workspace = await getWorkspaceByOrderId(request.params.orderId, customerId);
      if (!workspace) {
        return reply.status(404).send({ code: "not_found", message: "Order or workspace not found." });
      }
      return reply.send(workspace);
    }
  );

  app.post<{
    Params: { orderId: string };
    Body: { body: string; orderLineId?: string; partIndex?: number };
  }>(
    "/api/v1/orders/:orderId/workspace/comments",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      const body = request.body?.body;
      if (typeof body !== "string") {
        return reply.status(400).send({ code: "invalid_request", message: "body (string) is required." });
      }
      try {
        const comment = await addComment(request.params.orderId, customerId, {
          body,
          orderLineId: request.body?.orderLineId,
          partIndex: request.body?.partIndex
        });
        return reply.status(201).send(comment);
      } catch (error) {
        if (error instanceof WorkspaceServiceError) {
          const status = error.code === "ORDER_NOT_FOUND" ? 404 : 400;
          return reply.status(status).send({ code: error.code, message: error.message });
        }
        throw error;
      }
    }
  );
}
