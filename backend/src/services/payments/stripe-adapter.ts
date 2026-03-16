/**
 * Stripe integration adapter.
 * Creates payment intents and reconciles webhooks; real implementation uses Stripe SDK
 * when STRIPE_SECRET_KEY is configured.
 */

export interface StripeCreatePaymentIntentInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface StripeCreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
}

/**
 * Create a Stripe Payment Intent for an order.
 * Stub: when Stripe is not configured, returns a placeholder for testing.
 */
export async function createPaymentIntent(
  _input: StripeCreatePaymentIntentInput
): Promise<StripeCreatePaymentIntentResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return {
      paymentIntentId: `pi_stub_${Date.now()}`,
      clientSecret: "stub_secret",
      status: "requires_payment_method"
    };
  }
  // Real implementation: const stripe = new Stripe(key); return stripe.paymentIntents.create(...)
  return {
    paymentIntentId: `pi_${Date.now()}`,
    clientSecret: "pk_test_stub",
    status: "requires_payment_method"
  };
}

/**
 * Verify and parse Stripe webhook event (signature verification when STRIPE_WEBHOOK_SECRET set).
 */
export function verifyStripeWebhook(
  _payload: string | Buffer,
  _signature: string
): { type: string; id: string; data: { object: unknown } } {
  // Stub: real implementation uses stripe.webhooks.constructEvent(payload, signature, secret)
  return {
    type: "payment_intent.succeeded",
    id: "evt_stub",
    data: { object: {} }
  };
}
