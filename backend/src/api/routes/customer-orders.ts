import type { FastifyInstance } from "fastify";
import prisma from "../../db/client.js";
import { getOrderById } from "../../models/order.js";
import { getOrderTimeline } from "../../services/order-timeline-service.js";
import { requireRole } from "../middleware/auth.js";

export async function registerCustomerOrdersRoutes(app: FastifyInstance) {
  const requireCustomer = requireRole("customer");

  app.get("/api/v1/orders", {
    preHandler: [requireCustomer]
  }, async (request, reply) => {
    const customerId = request.user?.id;
    if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { lines: true },
      orderBy: { createdAt: "desc" }
    });
    return reply.send(orders);
  });

  app.get<{ Params: { id: string } }>("/api/v1/orders/:id", {
    preHandler: [requireCustomer]
  }, async (request, reply) => {
    const customerId = request.user?.id;
    if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

    const order = await prisma.order.findUnique({
      where: { id: request.params.id },
      include: {
        lines: true,
        approvalRequests: true,
        revisionRequests: true,
        reprintRequests: true,
        projectWorkspaces: { include: { comments: true } }
      }
    });
    if (!order) return reply.status(404).send({ code: "not_found", message: "Order not found." });
    if (order.customerId !== customerId) {
      return reply.status(404).send({ code: "not_found", message: "Order not found." });
    }
    const timeline = await getOrderTimeline(order.id);
    return reply.send({ ...order, timeline });
  });

  app.get<{ Params: { id: string } }>(
    "/api/v1/orders/:id/timeline",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      const order = await getOrderById(request.params.id);
      if (!order) return reply.status(404).send({ code: "not_found", message: "Order not found." });
      if (order.customerId !== customerId) {
        return reply.status(404).send({ code: "not_found", message: "Order not found." });
      }
      const timeline = await getOrderTimeline(order.id);
      return reply.send({ timeline });
    }
  );
}
