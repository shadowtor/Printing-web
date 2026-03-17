import type { FastifyInstance } from "fastify";
import {
  getCartWithTotals,
  addCartLine,
  updateCartLineQuantity,
  removeCartLine,
  CartServiceError
} from "../../services/cart-service.js";

export async function registerCartRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { sessionId?: string } }>(
    "/api/v1/cart",
    async (request, reply) => {
      const sessionId = request.query.sessionId ?? (request.headers["x-session-id"] as string | undefined);
      const customerId = request.user?.id;

      const cart = await getCartWithTotals({ sessionId, customerId });
      if (!cart) {
        return reply.send({
          cart: null,
          lines: [],
          totalItems: 0,
          totalCents: 0,
          currency: "AUD"
        });
      }
      return reply.send({
        cart: cart.cart,
        lines: cart.cart.lines,
        totalItems: cart.totalItems,
        totalCents: cart.totalCents,
        currency: cart.currency
      });
    }
  );

  app.post<{
    Body: { sessionId?: string; quoteId: string; jobId: string; quantity: number };
  }>("/api/v1/cart/lines", async (request, reply) => {
    const sessionId = request.body.sessionId ?? (request.headers["x-session-id"] as string | undefined);
    const customerId = request.user?.id;
    const { quoteId, jobId, quantity } = request.body;

    if (!quoteId || !jobId || quantity == null || quantity < 1) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "quoteId, jobId, and quantity (>= 1) are required."
      });
    }

    try {
      const line = await addCartLine({
        sessionId,
        customerId,
        quoteId,
        jobId,
        quantity
      });
      return reply.status(201).send(line);
    } catch (error) {
      if (error instanceof CartServiceError) {
        const status = error.code === "QUOTE_NOT_FOUND" || error.code === "JOB_NOT_FOUND" ? 404 : 400;
        return reply.status(status).send({
          code: error.code,
          message: error.message
        });
      }
      request.log.error({ err: error }, "addCartLine failed");
      return reply.status(500).send({
        code: "cart_error",
        message: "Failed to add to cart."
      });
    }
  });

  app.patch<{
    Params: { lineId: string };
    Body: { quantity: number; sessionId?: string };
  }>("/api/v1/cart/lines/:lineId", async (request, reply) => {
    const sessionId = request.body?.sessionId ?? (request.headers["x-session-id"] as string | undefined);
    const customerId = request.user?.id;
    const { lineId } = request.params;
    const { quantity } = request.body ?? {};

    if (typeof quantity !== "number" || quantity < 1) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "quantity (number >= 1) is required."
      });
    }

    try {
      const line = await updateCartLineQuantity(lineId, quantity, {
        sessionId,
        customerId
      });
      return reply.send(line);
    } catch (error) {
      if (error instanceof CartServiceError) {
        const status = error.code === "LINE_NOT_FOUND" ? 404 : 400;
        return reply.status(status).send({
          code: error.code,
          message: error.message
        });
      }
      request.log.error({ err: error }, "updateCartLineQuantity failed");
      return reply.status(500).send({
        code: "cart_error",
        message: "Failed to update cart line."
      });
    }
  });

  app.delete<{
    Params: { lineId: string };
    Querystring: { sessionId?: string };
  }>("/api/v1/cart/lines/:lineId", async (request, reply) => {
    const sessionId =
      request.query.sessionId ?? (request.headers["x-session-id"] as string | undefined);
    const customerId = request.user?.id;
    const { lineId } = request.params;

    try {
      await removeCartLine(lineId, { sessionId, customerId });
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof CartServiceError) {
        const status = error.code === "LINE_NOT_FOUND" ? 404 : 400;
        return reply.status(status).send({
          code: error.code,
          message: error.message
        });
      }
      request.log.error({ err: error }, "removeCartLine failed");
      return reply.status(500).send({
        code: "cart_error",
        message: "Failed to remove cart line."
      });
    }
  });
}
