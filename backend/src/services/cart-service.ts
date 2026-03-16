import {
  getOrCreateCart,
  getCartById,
  getCartBySessionId,
  getCartByCustomerId,
  createCartLine,
  getCartLineById,
  updateCartLine,
  deleteCartLine,
  type CartWithLines,
  type CartLine
} from "../models/cart.js";
import { getQuoteById, getJobById } from "../models/quote.js";

export class CartServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "CartServiceError";
  }
}

export interface CartWithTotals {
  cart: CartWithLines;
  totalItems: number;
  totalCents: number;
  currency: string;
}

/**
 * Get or create cart for session or customer, then return with totals.
 */
export async function getOrCreateCartWithTotals(params: {
  sessionId?: string;
  customerId?: string;
}): Promise<CartWithTotals> {
  const cart = await getOrCreateCart(params);
  const withLines = await getCartById(cart.id);
  if (!withLines) throw new CartServiceError("Cart not found after create", "CART_NOT_FOUND");
  return computeCartTotals(withLines);
}

/**
 * Add a locked quote job to the cart.
 * Validates: quote is locked, job belongs to quote, job not already in cart (optional).
 */
export async function addCartLine(params: {
  sessionId?: string;
  customerId?: string;
  quoteId: string;
  jobId: string;
  quantity: number;
}): Promise<CartLine> {
  const quote = await getQuoteById(params.quoteId);
  if (!quote) throw new CartServiceError("Quote not found", "QUOTE_NOT_FOUND");
  if (quote.status !== "locked") {
    throw new CartServiceError("Quote must be locked before adding to cart", "QUOTE_NOT_LOCKED");
  }

  const job = await getJobById(params.jobId);
  if (!job) throw new CartServiceError("Job not found", "JOB_NOT_FOUND");
  if (job.quoteId !== params.quoteId) {
    throw new CartServiceError("Job does not belong to this quote", "JOB_MISMATCH");
  }

  const cart = await getOrCreateCart({
    sessionId: params.sessionId,
    customerId: params.customerId
  });

  return createCartLine({
    cartId: cart.id,
    quoteId: params.quoteId,
    jobId: params.jobId,
    quantity: params.quantity,
    lockedUnitPrice: job.unitPrice,
    currency: quote.currency
  });
}

/**
 * Update cart line quantity.
 */
export async function updateCartLineQuantity(
  lineId: string,
  quantity: number,
  params: { sessionId?: string; customerId?: string }
): Promise<CartLine> {
  if (quantity < 1) throw new CartServiceError("Quantity must be at least 1", "INVALID_QUANTITY");
  const line = await getCartLineById(lineId);
  if (!line) throw new CartServiceError("Cart line not found", "LINE_NOT_FOUND");

  const cart = await getOrCreateCart(params);
  if (line.cartId !== cart.id) {
    throw new CartServiceError("Cart line does not belong to this cart", "CART_MISMATCH");
  }

  return updateCartLine(lineId, { quantity });
}

/**
 * Remove a line from the cart.
 */
export async function removeCartLine(
  lineId: string,
  params: { sessionId?: string; customerId?: string }
): Promise<void> {
  const line = await getCartLineById(lineId);
  if (!line) throw new CartServiceError("Cart line not found", "LINE_NOT_FOUND");

  const cart = await getOrCreateCart(params);
  if (line.cartId !== cart.id) {
    throw new CartServiceError("Cart line does not belong to this cart", "CART_MISMATCH");
  }

  await deleteCartLine(lineId);
}

/**
 * Get cart with totals by session or customer.
 */
export async function getCartWithTotals(params: {
  sessionId?: string;
  customerId?: string;
}): Promise<CartWithTotals | null> {
  if (params.customerId) {
    const cart = await getCartByCustomerId(params.customerId);
    if (!cart) return null;
    return computeCartTotals(cart);
  }
  if (params.sessionId) {
    const cart = await getCartBySessionId(params.sessionId);
    if (!cart) return null;
    return computeCartTotals(cart);
  }
  return null;
}

function computeCartTotals(cart: CartWithLines): CartWithTotals {
  let totalCents = 0;
  let totalItems = 0;
  let currency = "AUD";
  for (const line of cart.lines) {
    totalCents += line.lockedUnitPrice * line.quantity;
    totalItems += line.quantity;
    if (line.currency) currency = line.currency;
  }
  return {
    cart,
    totalItems,
    totalCents,
    currency
  };
}
