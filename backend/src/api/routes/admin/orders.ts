import type { FastifyInstance } from "fastify";
import { getOrderById, listOrders, updateOrder } from "../../../models/order.js";
import { getOrderTimeline } from "../../../services/order-timeline-service.js";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";
const preHandler = [requireAdmin];

export async function registerAdminOrdersRoutes(app: FastifyInstance) {
  app.get(`${prefix}/orders`, { preHandler }, async (request, reply) => {
    const query = request.query as {
      lifecycleStage?: string;
      paymentState?: string;
      limit?: string;
      offset?: string;
    };
    const limit = query.limit != null ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset != null ? parseInt(query.offset, 10) : undefined;
    if (limit != null && (Number.isNaN(limit) || limit < 1 || limit > 100)) {
      return reply.status(400).send({ code: "invalid_request", message: "limit must be 1–100." });
    }
    if (offset != null && (Number.isNaN(offset) || offset < 0)) {
      return reply.status(400).send({ code: "invalid_request", message: "offset must be >= 0." });
    }
    const orders = await listOrders({
      lifecycleStage: query.lifecycleStage,
      paymentState: query.paymentState,
      limit,
      offset
    });
    return reply.send(orders);
  });

  app.get<{ Params: { id: string } }>(`${prefix}/orders/:id`, { preHandler }, async (request, reply) => {
    const order = await getOrderById(request.params.id);
    if (!order) return reply.status(404).send({ code: "not_found", message: "Order not found." });
    const timeline = await getOrderTimeline(order.id);
    return reply.send({ ...order, timeline });
  });

  app.patch<{
    Params: { id: string };
    Body: { lifecycleStage?: string; paymentState?: string };
  }>(`${prefix}/orders/:id`, { preHandler }, async (request, reply) => {
    const order = await getOrderById(request.params.id);
    if (!order) return reply.status(404).send({ code: "not_found", message: "Order not found." });
    const body = request.body ?? {};
    if (!body.lifecycleStage && !body.paymentState) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "At least one of lifecycleStage or paymentState is required."
      });
    }
    const updated = await updateOrder(request.params.id, {
      ...(body.lifecycleStage != null && { lifecycleStage: body.lifecycleStage }),
      ...(body.paymentState != null && { paymentState: body.paymentState })
    });
    return reply.send(updated);
  });
}
