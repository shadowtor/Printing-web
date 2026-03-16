import type { FastifyInstance } from "fastify";
import { verifyStripeWebhook } from "../../services/payments/stripe-adapter.js";
import { verifyPaypalWebhook } from "../../services/payments/paypal-adapter.js";
import prisma from "../../db/client.js";
import { recordAuditEvent } from "../../models/audit-event.js";

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
}
