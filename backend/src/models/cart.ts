import prisma from "../db/client.js";
import type { Cart, CartLine } from "../../prisma/generated/prisma/client/client.js";

export type { Cart, CartLine };

export type CartWithLines = Cart & { lines: CartLine[] };

export interface CartCreateInput {
  sessionId?: string;
  customerId?: string;
}

export interface CartLineCreateInput {
  cartId: string;
  quoteId: string;
  jobId: string;
  quantity: number;
  lockedUnitPrice: number;
  currency: string;
}

export interface CartLineUpdateInput {
  quantity?: number;
}

/**
 * Create a cart (guest by sessionId or logged-in by customerId).
 */
export async function createCart(data: CartCreateInput): Promise<Cart> {
  return prisma.cart.create({
    data
  });
}

/**
 * Get cart by ID with lines.
 */
export async function getCartById(id: string): Promise<CartWithLines | null> {
  return prisma.cart.findUnique({
    where: { id },
    include: { lines: true }
  });
}

/**
 * Find cart by session ID (guest).
 */
export async function getCartBySessionId(sessionId: string): Promise<CartWithLines | null> {
  return prisma.cart.findFirst({
    where: { sessionId },
    include: { lines: true },
    orderBy: { updatedAt: "desc" }
  });
}

/**
 * Find cart by customer ID (logged-in).
 */
export async function getCartByCustomerId(customerId: string): Promise<CartWithLines | null> {
  return prisma.cart.findFirst({
    where: { customerId },
    include: { lines: true },
    orderBy: { updatedAt: "desc" }
  });
}

/**
 * Get or create cart for guest (sessionId) or customer (customerId).
 * Prefer customerId when both are provided.
 */
export async function getOrCreateCart(params: {
  sessionId?: string;
  customerId?: string;
}): Promise<Cart> {
  if (params.customerId) {
    const existing = await getCartByCustomerId(params.customerId);
    if (existing) return existing;
    return createCart({ customerId: params.customerId });
  }
  if (params.sessionId) {
    const existing = await getCartBySessionId(params.sessionId);
    if (existing) return existing;
    return createCart({ sessionId: params.sessionId });
  }
  throw new Error("Either sessionId or customerId is required for getOrCreateCart");
}

/**
 * Create a cart line (add locked quote job to cart).
 */
export async function createCartLine(data: CartLineCreateInput): Promise<CartLine> {
  return prisma.cartLine.create({
    data
  });
}

/**
 * Get cart line by ID.
 */
export async function getCartLineById(id: string): Promise<CartLine | null> {
  return prisma.cartLine.findUnique({
    where: { id }
  });
}

/**
 * Update cart line (e.g. quantity).
 */
export async function updateCartLine(
  id: string,
  data: CartLineUpdateInput
): Promise<CartLine> {
  return prisma.cartLine.update({
    where: { id },
    data
  });
}

/**
 * Delete a cart line.
 */
export async function deleteCartLine(id: string): Promise<CartLine> {
  return prisma.cartLine.delete({
    where: { id }
  });
}

/**
 * Delete all lines for a cart.
 */
export async function deleteCartLinesByCartId(cartId: string): Promise<number> {
  const result = await prisma.cartLine.deleteMany({
    where: { cartId }
  });
  return result.count;
}
