import prisma from "../db/client.js";
import type { Order, OrderLine } from "../../prisma/generated/prisma/client/client.js";

export type { Order, OrderLine };

export type PaymentMethod =
  | "stripe"
  | "paypal"
  | "cash"
  | "invoice"
  | "po"
  | "quote_request";
export type PaymentState = "pending" | "paid" | "failed" | "refunded" | "na";
export type LifecycleStage =
  | "draft"
  | "quote_submitted"
  | "approval_pending"
  | "approved"
  | "in_production"
  | "ready_to_ship"
  | "shipped"
  | "completed"
  | "cancelled";

export interface OrderCreateInput {
  orderNumber: string;
  customerId?: string;
  guestEmail?: string;
  paymentMethod: string;
  paymentState: string;
  lifecycleStage: string;
}

export interface OrderLineCreateInput {
  orderId: string;
  jobId: string;
  snapshot: object;
  quantity: number;
  lineTotal: number;
}

/**
 * Generate a unique order number (e.g. ORD-YYYYMMDD-XXXX).
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ymd}-${random}`;
}

/**
 * Create an order.
 */
export async function createOrder(data: OrderCreateInput): Promise<Order> {
  return prisma.order.create({
    data
  });
}

/**
 * Get order by ID with lines.
 */
export async function getOrderById(id: string): Promise<Order | null> {
  return prisma.order.findUnique({
    where: { id },
    include: { lines: true }
  });
}

/**
 * Get order by order number.
 */
export async function getOrderByOrderNumber(
  orderNumber: string
): Promise<Order | null> {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: { lines: true }
  });
}

/**
 * Create an order line (job snapshot at checkout).
 */
export async function createOrderLine(data: OrderLineCreateInput): Promise<OrderLine> {
  return prisma.orderLine.create({
    data: {
      ...data,
      snapshot: data.snapshot as object
    }
  });
}

/**
 * Update order (lifecycleStage and/or paymentState). Admin use.
 */
export async function updateOrder(
  id: string,
  data: { lifecycleStage?: string; paymentState?: string }
): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data
  });
}

/**
 * List orders with optional filters. Admin use.
 */
export async function listOrders(params?: {
  lifecycleStage?: string;
  paymentState?: string;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
  const where: { lifecycleStage?: string; paymentState?: string } = {};
  if (params?.lifecycleStage) where.lifecycleStage = params.lifecycleStage;
  if (params?.paymentState) where.paymentState = params.paymentState;
  return prisma.order.findMany({
    where,
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: params?.limit ?? 50,
    skip: params?.offset ?? 0
  });
}

/**
 * Update job with orderLineId after attaching to order.
 */
export async function setJobOrderLineId(
  jobId: string,
  orderLineId: string
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { orderLineId }
  });
}
