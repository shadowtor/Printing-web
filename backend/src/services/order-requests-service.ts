import prisma from "../db/client.js";
import { getOrderById } from "../models/order.js";
import type { ApprovalRequest, RevisionRequest, ReprintRequest } from "../../prisma/generated/prisma/client/client.js";

export type { ApprovalRequest, RevisionRequest, ReprintRequest };

export class OrderRequestsServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "OrderRequestsServiceError";
  }
}

function assertOrderOwnedByCustomer(orderId: string, customerId: string): Promise<void> {
  return getOrderById(orderId).then((order) => {
    if (!order) throw new OrderRequestsServiceError("Order not found", "ORDER_NOT_FOUND");
    if (order.customerId !== customerId) {
      throw new OrderRequestsServiceError("Order not found", "ORDER_NOT_FOUND");
    }
  });
}

/** Get active approval request for order (most recent pending). */
export async function getApprovalRequestByOrderId(orderId: string): Promise<ApprovalRequest | null> {
  return prisma.approvalRequest.findFirst({
    where: { orderId },
    orderBy: { requestedAt: "desc" }
  });
}

/** Respond to approval request (customer). */
export async function respondToApprovalRequest(
  orderId: string,
  customerId: string,
  data: { approved: boolean; customerNotes?: string }
): Promise<ApprovalRequest> {
  await assertOrderOwnedByCustomer(orderId, customerId);
  const approval = await getApprovalRequestByOrderId(orderId);
  if (!approval) throw new OrderRequestsServiceError("Approval request not found", "NOT_FOUND");
  if (approval.status !== "pending") {
    throw new OrderRequestsServiceError("Approval request already responded", "ALREADY_RESPONDED");
  }
  return prisma.approvalRequest.update({
    where: { id: approval.id },
    data: {
      status: data.approved ? "approved" : "rejected",
      customerNotes: data.customerNotes,
      customerResponseAt: new Date()
    }
  });
}

/** Create revision request (customer). */
export async function createRevisionRequest(
  orderId: string,
  customerId: string,
  data: { orderLineId?: string; customerNotes?: string }
): Promise<RevisionRequest> {
  await assertOrderOwnedByCustomer(orderId, customerId);
  return prisma.revisionRequest.create({
    data: {
      orderId,
      orderLineId: data.orderLineId,
      type: "revision",
      customerNotes: data.customerNotes ?? undefined,
      status: "pending"
    }
  });
}

/** Create reprint request (customer). */
export async function createReprintRequest(
  orderId: string,
  customerId: string,
  data: { orderLineId?: string; customerNotes?: string }
): Promise<ReprintRequest> {
  await assertOrderOwnedByCustomer(orderId, customerId);
  return prisma.reprintRequest.create({
    data: {
      orderId,
      orderLineId: data.orderLineId,
      type: "reprint",
      customerNotes: data.customerNotes ?? undefined,
      status: "pending"
    }
  });
}

/** List revision requests for order. */
export async function getRevisionRequestsByOrderId(orderId: string): Promise<RevisionRequest[]> {
  return prisma.revisionRequest.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" }
  });
}

/** List reprint requests for order. */
export async function getReprintRequestsByOrderId(orderId: string): Promise<ReprintRequest[]> {
  return prisma.reprintRequest.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" }
  });
}
