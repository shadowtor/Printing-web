import type { FastifyInstance } from "fastify";
import { listEnabledPaymentMethods } from "../../models/payment-method-config.js";
import { checkout, validatePaymentMethod, CheckoutServiceError } from "../../services/checkout-service.js";

export async function registerCheckoutRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/checkout/payment-methods
   * List enabled payment methods for checkout.
   */
  app.get("/api/v1/checkout/payment-methods", async (_request, reply) => {
    const methods = await listEnabledPaymentMethods();
    return reply.send(
      methods.map((m) => ({
        method: m.method,
        sortOrder: m.sortOrder
      }))
    );
  });

  /**
   * POST /api/v1/checkout
   * Create order from cart and clear cart.
   * Body: { sessionId?, customerId?, paymentMethod, guestEmail? }
   */
  app.post<{
    Body: {
      sessionId?: string;
      paymentMethod: string;
      guestEmail?: string;
    };
  }>("/api/v1/checkout", async (request, reply) => {
    const customerId = request.user?.id;
    const sessionId =
      request.body.sessionId ?? (request.headers["x-session-id"] as string | undefined);
    const { paymentMethod, guestEmail } = request.body;

    if (!paymentMethod) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "paymentMethod is required."
      });
    }

    try {
      await validatePaymentMethod(paymentMethod);
    } catch (error) {
      if (error instanceof CheckoutServiceError) {
        return reply.status(400).send({
          code: error.code,
          message: error.message
        });
      }
      throw error;
    }

    try {
      const result = await checkout({
        sessionId,
        customerId,
        paymentMethod,
        guestEmail
      });
      return reply.status(201).send({
        orderId: result.order.id,
        orderNumber: result.orderNumber
      });
    } catch (error) {
      if (error instanceof CheckoutServiceError) {
        const status =
          error.code === "CART_EMPTY"
            ? 400
            : error.code === "PAYMENT_METHOD_DISABLED"
              ? 422
              : 400;
        return reply.status(status).send({
          code: error.code,
          message: error.message
        });
      }
      request.log.error({ err: error }, "checkout failed");
      return reply.status(500).send({
        code: "checkout_error",
        message: "Checkout failed."
      });
    }
  });
}
