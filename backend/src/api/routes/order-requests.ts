import type { FastifyInstance } from "fastify";
import {
  getApprovalRequestByOrderId,
  respondToApprovalRequest,
  createRevisionRequest,
  createReprintRequest,
  getRevisionRequestsByOrderId,
  getReprintRequestsByOrderId,
  OrderRequestsServiceError
} from "../../services/order-requests-service.js";
import { getOrderById } from "../../models/order.js";
import { requireRole } from "../middleware/auth.js";

export async function registerOrderRequestsRoutes(app: FastifyInstance) {
  const requireCustomer = requireRole("customer");

  app.get<{ Params: { orderId: string } }>(
    "/api/v1/orders/:orderId/approval-request",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      try {
        const approval = await getApprovalRequestByOrderId(request.params.orderId);
        if (!approval) return reply.status(404).send({ code: "not_found", message: "Approval request not found." });
        const order = await getOrderById(request.params.orderId);
        if (!order || order.customerId !== customerId) {
          return reply.status(404).send({ code: "not_found", message: "Order not found." });
        }
        return reply.send(approval);
      } catch (error) {
        if (error instanceof OrderRequestsServiceError) {
          return reply.status(error.code === "ORDER_NOT_FOUND" ? 404 : 400).send({
            code: error.code,
            message: error.message
          });
        }
        throw error;
      }
    }
  );

  app.post<{
    Params: { orderId: string };
    Body: { approved: boolean; customerNotes?: string };
  }>(
    "/api/v1/orders/:orderId/approval-request/respond",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      const { approved, customerNotes } = request.body ?? {};
      if (typeof approved !== "boolean") {
        return reply.status(400).send({ code: "invalid_request", message: "approved (boolean) is required." });
      }
      try {
        const result = await respondToApprovalRequest(request.params.orderId, customerId, {
          approved,
          customerNotes
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof OrderRequestsServiceError) {
          const status = error.code === "ORDER_NOT_FOUND" || error.code === "NOT_FOUND" ? 404 : 400;
          return reply.status(status).send({ code: error.code, message: error.message });
        }
        throw error;
      }
    }
  );

  app.post<{
    Params: { orderId: string };
    Body: { orderLineId?: string; customerNotes?: string };
  }>(
    "/api/v1/orders/:orderId/revision-request",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      try {
        const result = await createRevisionRequest(request.params.orderId, customerId, request.body ?? {});
        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof OrderRequestsServiceError) {
          return reply.status(error.code === "ORDER_NOT_FOUND" ? 404 : 400).send({
            code: error.code,
            message: error.message
          });
        }
        throw error;
      }
    }
  );

  app.post<{
    Params: { orderId: string };
    Body: { orderLineId?: string; customerNotes?: string };
  }>(
    "/api/v1/orders/:orderId/reprint-request",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

      try {
        const result = await createReprintRequest(request.params.orderId, customerId, request.body ?? {});
        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof OrderRequestsServiceError) {
          return reply.status(error.code === "ORDER_NOT_FOUND" ? 404 : 400).send({
            code: error.code,
            message: error.message
          });
        }
        throw error;
      }
    }
  );

  app.get<{ Params: { orderId: string } }>(
    "/api/v1/orders/:orderId/revision-requests",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });
      const order = await getOrderById(request.params.orderId);
      if (!order || order.customerId !== customerId) {
        return reply.status(404).send({ code: "not_found", message: "Order not found." });
      }
      const list = await getRevisionRequestsByOrderId(request.params.orderId);
      return reply.send(list);
    }
  );

  app.get<{ Params: { orderId: string } }>(
    "/api/v1/orders/:orderId/reprint-requests",
    { preHandler: [requireCustomer] },
    async (request, reply) => {
      const customerId = request.user?.id;
      if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });
      const order = await getOrderById(request.params.orderId);
      if (!order || order.customerId !== customerId) {
        return reply.status(404).send({ code: "not_found", message: "Order not found." });
      }
      const list = await getReprintRequestsByOrderId(request.params.orderId);
      return reply.send(list);
    }
  );
}
