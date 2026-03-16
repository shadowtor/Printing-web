import prisma from "../db/client.js";
import { getOrderById } from "../models/order.js";
import type { ProjectWorkspace, PinnedPartComment } from "../../prisma/generated/prisma/client/client.js";

export type { ProjectWorkspace, PinnedPartComment };

export class WorkspaceServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "WorkspaceServiceError";
  }
}

export async function getOrCreateWorkspaceForOrder(
  orderId: string,
  customerId: string,
  name?: string
): Promise<ProjectWorkspace> {
  const order = await getOrderById(orderId);
  if (!order) throw new WorkspaceServiceError("Order not found", "ORDER_NOT_FOUND");
  if (order.customerId !== customerId) {
    throw new WorkspaceServiceError("Order not found", "ORDER_NOT_FOUND");
  }
  let workspace = await prisma.projectWorkspace.findFirst({
    where: { orderId },
    include: { comments: true }
  });
  if (workspace) return workspace;
  workspace = await prisma.projectWorkspace.create({
    data: { orderId, name: name ?? undefined },
    include: { comments: true }
  });
  return workspace;
}

export async function getWorkspaceByOrderId(
  orderId: string,
  customerId: string
): Promise<ProjectWorkspace & { comments: PinnedPartComment[] } | null> {
  const order = await getOrderById(orderId);
  if (!order || order.customerId !== customerId) return null;
  const workspace = await prisma.projectWorkspace.findFirst({
    where: { orderId },
    include: { comments: { orderBy: { createdAt: "asc" } } }
  });
  return workspace;
}

export interface CreateCommentInput {
  body: string;
  orderLineId?: string;
  partIndex?: number;
}

export async function addComment(
  orderId: string,
  customerId: string,
  input: CreateCommentInput
): Promise<PinnedPartComment> {
  const order = await getOrderById(orderId);
  if (!order) throw new WorkspaceServiceError("Order not found", "ORDER_NOT_FOUND");
  if (order.customerId !== customerId) {
    throw new WorkspaceServiceError("Order not found", "ORDER_NOT_FOUND");
  }
  let workspace = await prisma.projectWorkspace.findFirst({ where: { orderId } });
  if (!workspace) {
    workspace = await prisma.projectWorkspace.create({ data: { orderId } });
  }
  const body = (input.body ?? "").trim().slice(0, 10_000);
  if (!body) throw new WorkspaceServiceError("Comment body is required", "INVALID_BODY");
  return prisma.pinnedPartComment.create({
    data: {
      workspaceId: workspace.id,
      orderLineId: input.orderLineId,
      partIndex: input.partIndex,
      authorId: customerId,
      authorType: "customer",
      body
    }
  });
}
