import type { FastifyInstance } from "fastify";
import {
  listQueues,
  getQueueById,
  createQueue,
  updateQueue,
  deleteQueue,
  listQueueItems,
  addQueueItem,
  updateQueueItem,
  QueueServiceError
} from "../../../services/queue-service.js";
import { createPrinterAssignmentPayload } from "../../../services/printer-assignment-service.js";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";
const preHandler = [requireAdmin];

export async function registerAdminQueuesRoutes(app: FastifyInstance) {
  app.get(`${prefix}/queues`, { preHandler }, async (_request, reply) => {
    const queues = await listQueues();
    return reply.send(queues);
  });

  app.get<{ Params: { id: string } }>(`${prefix}/queues/:id`, { preHandler }, async (request, reply) => {
    try {
      const queue = await getQueueById(request.params.id);
      if (!queue) return reply.status(404).send({ code: "not_found", message: "Queue not found." });
      return reply.send(queue);
    } catch (error) {
      if (error instanceof QueueServiceError) {
        return reply.status(404).send({ code: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.post<{ Body: { name: string; active?: boolean } }>(`${prefix}/queues`, { preHandler }, async (request, reply) => {
    const body = request.body ?? {};
    if (!body.name || typeof body.name !== "string") {
      return reply.status(400).send({ code: "invalid_request", message: "name is required." });
    }
    const queue = await createQueue({ name: body.name, active: body.active });
    return reply.status(201).send(queue);
  });

  app.patch<{
    Params: { id: string };
    Body: { name?: string; active?: boolean };
  }>(`${prefix}/queues/:id`, { preHandler }, async (request, reply) => {
    try {
      const queue = await updateQueue(request.params.id, request.body ?? {});
      return reply.send(queue);
    } catch (error) {
      if (error instanceof QueueServiceError) {
        return reply.status(404).send({ code: error.code, message: error.message });
      }
      if ((error as { code?: string })?.code === "P2025") {
        return reply.status(404).send({ code: "not_found", message: "Queue not found." });
      }
      throw error;
    }
  });

  app.delete<{ Params: { id: string } }>(`${prefix}/queues/:id`, { preHandler }, async (request, reply) => {
    try {
      await deleteQueue(request.params.id);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof QueueServiceError) {
        return reply.status(404).send({ code: error.code, message: error.message });
      }
      if ((error as { code?: string })?.code === "P2025") {
        return reply.status(404).send({ code: "not_found", message: "Queue not found." });
      }
      throw error;
    }
  });

  app.get<{ Params: { id: string } }>(`${prefix}/queues/:id/items`, { preHandler }, async (request, reply) => {
    try {
      const items = await listQueueItems(request.params.id);
      return reply.send(items);
    } catch (error) {
      if (error instanceof QueueServiceError) {
        return reply.status(error.code === "QUEUE_NOT_FOUND" ? 404 : 400).send({
          code: error.code,
          message: error.message
        });
      }
      throw error;
    }
  });

  app.post<{
    Params: { id: string };
    Body: { orderLineId: string };
  }>(`${prefix}/queues/:id/items`, { preHandler }, async (request, reply) => {
    const { orderLineId } = request.body ?? {};
    if (!orderLineId) {
      return reply.status(400).send({ code: "invalid_request", message: "orderLineId is required." });
    }
    try {
      const item = await addQueueItem(request.params.id, orderLineId);
      return reply.status(201).send(item);
    } catch (error) {
      if (error instanceof QueueServiceError) {
        const status =
          error.code === "QUEUE_NOT_FOUND" || error.code === "ORDER_LINE_NOT_FOUND" ? 404 : 400;
        return reply.status(status).send({ code: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.patch<{
    Params: { id: string; itemId: string };
    Body: { status?: string };
  }>(`${prefix}/queues/:id/items/:itemId`, { preHandler }, async (request, reply) => {
    const { itemId } = request.params;
    const { status } = request.body ?? {};
    try {
      const item = await updateQueueItem(itemId, { status });
      return reply.send(item);
    } catch (error) {
      if (error instanceof QueueServiceError) {
        return reply.status(error.code === "ITEM_NOT_FOUND" ? 404 : 400).send({
          code: error.code,
          message: error.message
        });
      }
      throw error;
    }
  });

  /**
   * POST /api/v1/admin/orders/:orderId/lines/:orderLineId/prepare
   * Create printer-assignment payload for an order line (trigger "prepare" for production).
   */
  app.post<{
    Params: { orderId: string; orderLineId: string };
    Body: { printerId?: string; status?: string; [key: string]: unknown };
  }>(
    `${prefix}/orders/:orderId/lines/:orderLineId/prepare`,
    { preHandler },
    async (request, reply) => {
      const { orderLineId } = request.params;
      const body = (request.body ?? {}) as Record<string, unknown>;
      try {
        const result = await createPrinterAssignmentPayload(orderLineId, {
          orderLineId,
          printerId: body.printerId as string | undefined,
          status: (body.status as string) ?? "pending",
          ...body
        });
        return reply.status(201).send(result);
      } catch (error) {
        request.log.error({ err: error }, "createPrinterAssignmentPayload failed");
        return reply.status(400).send({
          code: "prepare_error",
          message: error instanceof Error ? error.message : "Failed to create printer assignment payload."
        });
      }
    }
  );
}
