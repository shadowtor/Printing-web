import { getOrCreateCartWithTotals } from "./cart-service.js";
import { listEnabledPaymentMethods } from "../models/payment-method-config.js";
import {
  createOrder,
  createOrderLine,
  generateOrderNumber,
  type Order
} from "../models/order.js";
import { setJobOrderLineId } from "../models/order.js";
import { getJobById } from "../models/quote.js";
import { deleteCartLinesByCartId } from "../models/cart.js";
import { recordAuditEvent } from "../models/audit-event.js";

export class CheckoutServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "CheckoutServiceError";
  }
}

export interface CheckoutInput {
  sessionId?: string;
  customerId?: string;
  paymentMethod: string;
  guestEmail?: string;
}

export interface CheckoutResult {
  order: Order;
  orderNumber: string;
}

/**
 * Validate that the given payment method is enabled.
 */
export async function validatePaymentMethod(method: string): Promise<void> {
  const enabled = await listEnabledPaymentMethods();
  const found = enabled.some((c) => c.method === method);
  if (!found) {
    throw new CheckoutServiceError(
      `Payment method "${method}" is not enabled`,
      "PAYMENT_METHOD_DISABLED"
    );
  }
}

/**
 * Build a job snapshot for order line (material, quality, quantity, unit price, file refs, etc.).
 */
function buildJobSnapshot(job: Awaited<ReturnType<typeof getJobById>>): object {
  if (!job) return {};
  return {
    jobId: job.id,
    quoteId: job.quoteId,
    materialId: job.materialId,
    qualityId: job.qualityId,
    toleranceClassId: job.toleranceClassId,
    quantity: job.quantity,
    turnaroundProfileId: job.turnaroundProfileId,
    unitPrice: job.unitPrice,
    feasibilityStatus: job.feasibilityStatus,
    leadTimeDays: job.leadTimeDays
  };
}

/**
 * Create order from current cart and clear cart. Idempotent per cart: one checkout = one order.
 */
export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  await validatePaymentMethod(input.paymentMethod);

  const cartWithTotals = await getOrCreateCartWithTotals({
    sessionId: input.sessionId,
    customerId: input.customerId
  });

  if (!cartWithTotals.cart.lines.length) {
    throw new CheckoutServiceError("Cart is empty", "CART_EMPTY");
  }

  const orderNumber = generateOrderNumber();
  const order = await createOrder({
    orderNumber,
    customerId: input.customerId,
    guestEmail: input.guestEmail,
    paymentMethod: input.paymentMethod,
    paymentState: "pending",
    lifecycleStage: "quote_submitted"
  });

  for (const line of cartWithTotals.cart.lines) {
    const job = await getJobById(line.jobId);
    const snapshot = buildJobSnapshot(job);
    const orderLine = await createOrderLine({
      orderId: order.id,
      jobId: line.jobId,
      snapshot,
      quantity: line.quantity,
      lineTotal: line.lockedUnitPrice * line.quantity
    });
    await setJobOrderLineId(line.jobId, orderLine.id);
  }

  await deleteCartLinesByCartId(cartWithTotals.cart.id);

  await recordAuditEvent({
    entityType: "order",
    entityId: order.id,
    action: "created",
    actorId: input.customerId,
    actorType: input.customerId ? "customer" : "guest",
    newValue: { orderNumber, paymentMethod: input.paymentMethod }
  });

  return { order, orderNumber };
}
