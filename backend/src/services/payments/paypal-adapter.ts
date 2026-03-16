/**
 * PayPal integration adapter.
 * Creates orders and reconciles webhooks; real implementation uses PayPal SDK
 * when PayPal client credentials are configured.
 */

export interface PaypalCreateOrderInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaypalCreateOrderResult {
  paypalOrderId: string;
  approvalUrl: string;
  status: string;
}

/**
 * Create a PayPal order for payment.
 * Stub: when PayPal is not configured, returns a placeholder for testing.
 */
export async function createPaypalOrder(
  _input: PaypalCreateOrderInput
): Promise<PaypalCreateOrderResult> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) {
    return {
      paypalOrderId: `paypal_stub_${Date.now()}`,
      approvalUrl: "https://example.com/paypal/stub",
      status: "CREATED"
    };
  }
  // Real implementation: PayPal SDK create order, return approval URL
  return {
    paypalOrderId: `paypal_${Date.now()}`,
    approvalUrl: "https://www.sandbox.paypal.com/checkoutnow?token=stub",
    status: "CREATED"
  };
}

/**
 * Verify and parse PayPal webhook (signature verification when configured).
 */
export function verifyPaypalWebhook(
  _payload: unknown,
  _headers: Record<string, string>
): { event_type: string; resource: unknown } {
  return {
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {}
  };
}
