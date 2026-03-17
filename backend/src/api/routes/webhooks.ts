import type { FastifyInstance } from "fastify";
import { verifyStripeWebhook } from "../../services/payments/stripe-adapter.js";
import { verifyPaypalWebhook } from "../../services/payments/paypal-adapter.js";
import { env } from "../../config/index.js";
import prisma from "../../db/client.js";
import { recordAuditEvent } from "../../models/audit-event.js";
import {
  getLatestPrinterAssignmentByOrderLineId,
  updatePrinterAssignmentStatusById
} from "../../services/printer-assignment-service.js";

/**
 * Idempotent reconciliation: skip if we already recorded this payment intent.
 */
async function markOrderPaidByStripePaymentIntent(
  paymentIntentId: string
): Promise<boolean> {
  const existing = await prisma.auditEvent.findFirst({
    where: { entityType: "payment", entityId: paymentIntentId, action: "payment_reconciled" }
  });
  if (existing) return false;
  // Real impl: resolve order from Stripe event metadata, set paymentState to "paid"
  return true;
}

async function markOrderPaidByPaypalOrderId(paypalOrderId: string): Promise<boolean> {
  const existing = await prisma.auditEvent.findFirst({
    where: { entityType: "payment", entityId: paypalOrderId, action: "payment_reconciled" }
  });
  if (existing) return false;
  return true;
}

export async function registerWebhookRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/webhooks/stripe
   * Stripe webhook: verify signature, parse event, reconcile payment idempotently.
   */
  app.post("/api/v1/webhooks/stripe", async (request, reply) => {
    const body = request.body;
    const payload = typeof body === "string" ? body : JSON.stringify(body ?? {});
    const signature = (request.headers["stripe-signature"] as string) ?? "";

    try {
      const event = verifyStripeWebhook(payload, signature);
      if (event.type === "payment_intent.succeeded") {
        const paymentIntentId = (event.data?.object as { id?: string })?.id;
        if (paymentIntentId) {
          const applied = await markOrderPaidByStripePaymentIntent(paymentIntentId);
          if (applied) {
            await recordAuditEvent({
              entityType: "payment",
              entityId: paymentIntentId,
              action: "payment_reconciled",
              actorType: "system",
              newValue: { paymentIntentId, source: "stripe_webhook" }
            });
          }
        }
      }
      return reply.status(200).send({ received: true });
    } catch (error) {
      request.log.error({ err: error }, "Stripe webhook error");
      return reply.status(400).send({ received: false, error: "Webhook handling failed" });
    }
  });

  /**
   * POST /api/v1/webhooks/paypal
   * PayPal webhook: verify, parse, reconcile idempotently.
   */
  app.post("/api/v1/webhooks/paypal", async (request, reply) => {
    const body = request.body as unknown;
    const headers = request.headers as Record<string, string>;

    try {
      const event = verifyPaypalWebhook(body, headers);
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const resource = event.resource as { id?: string };
        const paypalOrderId = resource?.id;
        if (paypalOrderId) {
          const applied = await markOrderPaidByPaypalOrderId(paypalOrderId);
          if (applied) {
            await recordAuditEvent({
              entityType: "payment",
              entityId: paypalOrderId,
              action: "payment_reconciled",
              actorType: "system",
              newValue: { paypalOrderId, source: "paypal_webhook" }
            });
          }
        }
      }
      return reply.status(200).send({ received: true });
    } catch (error) {
      request.log.error({ err: error }, "PayPal webhook error");
      return reply.status(400).send({ received: false, error: "Webhook handling failed" });
    }
  });

  /**
   * POST /api/v1/webhooks/connector
   * Connector webhook: service-to-service auth via CONNECTOR_WEBHOOK_SECRET.
   */
  app.post<{
    Body: {
      eventType?: string;
      orderLineId?: string;
      status?: string;
      connectorJobId?: string;
      metadata?: Record<string, unknown>;
    };
  }>("/api/v1/webhooks/connector", async (request, reply) => {
    const expectedSecret = env.CONNECTOR_WEBHOOK_SECRET;
    if (!expectedSecret) {
      return reply.status(503).send({
        code: "connector_webhook_not_configured",
        message: "Connector webhook secret is not configured."
      });
    }

    const authHeader = request.headers.authorization;
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!bearerSecret || bearerSecret !== expectedSecret) {
      return reply.status(401).send({ code: "unauthorized", message: "Invalid connector webhook secret." });
    }

    const eventType = request.body?.eventType ?? "unknown";
    const orderLineId = request.body?.orderLineId;
    const status = request.body?.status;

    if (orderLineId && status) {
      const assignment = await getLatestPrinterAssignmentByOrderLineId(orderLineId);
      if (assignment) {
        await updatePrinterAssignmentStatusById(assignment.id, status);
      }
    }

    await recordAuditEvent({
      entityType: "other",
      entityId: request.body?.connectorJobId ?? orderLineId ?? "connector_event",
      action: `connector_${eventType}`,
      actorType: "system",
      newValue: request.body
    });

    return reply.status(202).send({ received: true });
  });
}
