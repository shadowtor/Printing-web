import prisma from "../db/client.js";

/**
 * Payload shape for printer assignment (contract for downstream systems).
 * Can be extended with printerId, machine settings, etc.
 */
export interface PrinterAssignmentPayloadShape {
  orderLineId: string;
  orderId?: string;
  jobId?: string;
  quantity?: number;
  printerId?: string;
  status?: string;
  [key: string]: unknown;
}

export async function createPrinterAssignmentPayload(
  orderLineId: string,
  payload: PrinterAssignmentPayloadShape
): Promise<{ id: string; orderLineId: string; status: string }> {
  const orderLine = await prisma.orderLine.findUnique({
    where: { id: orderLineId },
    include: { order: true }
  });
  if (!orderLine) {
    throw new Error("Order line not found.");
  }
  const fullPayload: PrinterAssignmentPayloadShape = {
    ...payload,
    orderLineId,
    orderId: orderLine.orderId,
    jobId: orderLine.jobId,
    quantity: orderLine.quantity
  };
  const created = await prisma.printerAssignmentPayload.create({
    data: {
      orderLineId,
      payload: fullPayload as object,
      status: payload.status ?? "pending"
    }
  });
  return {
    id: created.id,
    orderLineId: created.orderLineId,
    status: created.status
  };
}

export async function getPrinterAssignmentsByOrderLineId(orderLineId: string) {
  return prisma.printerAssignmentPayload.findMany({
    where: { orderLineId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getLatestPrinterAssignmentByOrderLineId(orderLineId: string) {
  return prisma.printerAssignmentPayload.findFirst({
    where: { orderLineId },
    orderBy: { createdAt: "desc" }
  });
}

export async function updatePrinterAssignmentStatusById(id: string, status: string) {
  return prisma.printerAssignmentPayload.update({
    where: { id },
    data: { status }
  });
}
