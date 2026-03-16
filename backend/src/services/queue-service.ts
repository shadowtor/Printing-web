import prisma from "../db/client.js";

export class QueueServiceError extends Error {
  constructor(
    message: string,
    public code: "QUEUE_NOT_FOUND" | "ITEM_NOT_FOUND" | "ORDER_LINE_NOT_FOUND" | "INVALID_REQUEST"
  ) {
    super(message);
    this.name = "QueueServiceError";
  }
}

export async function listQueues() {
  return prisma.productionQueue.findMany({
    orderBy: { name: "asc" },
    include: { items: true }
  });
}

export async function getQueueById(id: string) {
  return prisma.productionQueue.findUnique({
    where: { id },
    include: { items: { include: { orderLine: true } } }
  });
}

export async function createQueue(data: { name: string; active?: boolean }) {
  return prisma.productionQueue.create({
    data: { name: data.name, active: data.active ?? true }
  });
}

export async function updateQueue(
  id: string,
  data: { name?: string; active?: boolean }
) {
  return prisma.productionQueue.update({
    where: { id },
    data
  });
}

export async function deleteQueue(id: string) {
  return prisma.productionQueue.delete({
    where: { id }
  });
}

export async function listQueueItems(queueId: string) {
  const queue = await prisma.productionQueue.findUnique({
    where: { id: queueId },
    include: { items: { include: { orderLine: true } } }
  });
  if (!queue) throw new QueueServiceError("Queue not found.", "QUEUE_NOT_FOUND");
  return queue.items;
}

export async function addQueueItem(queueId: string, orderLineId: string) {
  const queue = await prisma.productionQueue.findUnique({ where: { id: queueId } });
  if (!queue) throw new QueueServiceError("Queue not found.", "QUEUE_NOT_FOUND");
  const orderLine = await prisma.orderLine.findUnique({ where: { id: orderLineId } });
  if (!orderLine) throw new QueueServiceError("Order line not found.", "ORDER_LINE_NOT_FOUND");
  const existing = await prisma.productionQueueItem.findFirst({
    where: { queueId, orderLineId }
  });
  if (existing) throw new QueueServiceError("Order line already in this queue.", "INVALID_REQUEST");
  return prisma.productionQueueItem.create({
    data: { queueId, orderLineId, status: "pending" }
  });
}

export async function updateQueueItem(
  itemId: string,
  data: { status?: string }
) {
  const item = await prisma.productionQueueItem.findUnique({
    where: { id: itemId }
  });
  if (!item) throw new QueueServiceError("Queue item not found.", "ITEM_NOT_FOUND");
  return prisma.productionQueueItem.update({
    where: { id: itemId },
    data
  });
}
