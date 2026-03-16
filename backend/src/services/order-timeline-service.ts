import { getOrderById } from "../models/order.js";
import prisma from "../db/client.js";

export interface TimelineEvent {
  at: Date;
  stage: string;
  label: string;
  source: "order" | "queue";
}

/**
 * Build a production progress timeline from order lifecycle stage and queue item status.
 * Order stages: quote_submitted → approval_pending → approved → in_production → ready_to_ship → shipped → completed.
 * Queue items: queued → assigned → in_progress → done.
 */
export async function getOrderTimeline(orderId: string): Promise<TimelineEvent[]> {
  const order = await getOrderById(orderId);
  if (!order) return [];

  const events: TimelineEvent[] = [];

  events.push({
    at: order.createdAt,
    stage: order.lifecycleStage,
    label: formatStageLabel(order.lifecycleStage),
    source: "order"
  });

  const queueItems = await prisma.productionQueueItem.findMany({
    where: { orderLine: { orderId } },
    include: { queue: true },
    orderBy: { createdAt: "asc" }
  });

  for (const item of queueItems) {
    events.push({
      at: item.createdAt,
      stage: item.status,
      label: `Queue "${item.queue.name}": ${item.status}`,
      source: "queue"
    });
    if (item.updatedAt.getTime() !== item.createdAt.getTime()) {
      events.push({
        at: item.updatedAt,
        stage: item.status,
        label: `Queue "${item.queue.name}": ${item.status} (updated)`,
        source: "queue"
      });
    }
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return events;
}

function formatStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    quote_submitted: "Quote submitted",
    approval_pending: "Approval pending",
    approved: "Approved",
    in_production: "In production",
    ready_to_ship: "Ready to ship",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled"
  };
  return labels[stage] ?? stage;
}
