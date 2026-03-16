import type { FastifyInstance } from "fastify";
import prisma from "../../db/client.js";
import { getOrderById, getOrderByOrderNumber } from "../../models/order.js";
import { requireRole } from "../middleware/auth.js";

export async function registerGuestLinkRoutes(app: FastifyInstance) {
  const requireCustomer = requireRole("customer");

  /**
   * POST /api/v1/guest-link
   * Link a guest order to the current account by matching guest email.
   * Body: { orderNumber?: string, orderId?: string }
   * Order must have guestEmail set and no customerId; guestEmail is used to verify ownership.
   */
  app.post<{
    Body: { orderNumber?: string; orderId?: string };
  }>("/api/v1/guest-link", { preHandler: [requireCustomer] }, async (request, reply) => {
    const customerId = request.user?.id;
    if (!customerId) return reply.status(401).send({ code: "unauthorized", message: "Not authenticated." });

    const { orderNumber, orderId } = request.body ?? {};
    let order = null;
    if (orderId) {
      order = await getOrderById(orderId);
    } else if (orderNumber) {
      order = await getOrderByOrderNumber(orderNumber);
    }
    if (!order) {
      return reply.status(404).send({ code: "not_found", message: "Order not found." });
    }
    if (order.customerId) {
      return reply.status(400).send({
        code: "already_linked",
        message: "Order is already linked to an account."
      });
    }
    if (!order.guestEmail?.trim()) {
      return reply.status(400).send({
        code: "not_guest_order",
        message: "Order has no guest email; cannot link."
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    if (!customer) return reply.status(401).send({ code: "unauthorized", message: "Customer not found." });

    const orderEmail = order.guestEmail.trim().toLowerCase();
    const customerEmail = customer.email.toLowerCase();
    if (orderEmail !== customerEmail) {
      return reply.status(403).send({
        code: "email_mismatch",
        message: "Order guest email does not match your account email."
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { customerId }
    });

    return reply.status(200).send({
      linked: true,
      orderId: order.id,
      orderNumber: order.orderNumber
    });
  });
}
