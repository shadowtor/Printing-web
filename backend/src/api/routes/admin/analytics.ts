import type { FastifyInstance } from "fastify";
import prisma from "../../../db/client.js";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";
const preHandler = [requireAdmin];

export async function registerAdminAnalyticsRoutes(app: FastifyInstance) {
  app.get(`${prefix}/analytics/summary`, { preHandler }, async (_request, reply) => {
    const [orderCount, revenueResult] = await Promise.all([
      prisma.order.count(),
      prisma.orderLine.aggregate({
        _sum: { lineTotal: true }
      })
    ]);
    const totalRevenueCents = revenueResult._sum.lineTotal ?? 0;
    const byStage = await prisma.order.groupBy({
      by: ["lifecycleStage"],
      _count: { id: true }
    });
    const byPaymentState = await prisma.order.groupBy({
      by: ["paymentState"],
      _count: { id: true }
    });
    return reply.send({
      orderCount,
      totalRevenueCents,
      byLifecycleStage: Object.fromEntries(byStage.map((s) => [s.lifecycleStage, s._count.id])),
      byPaymentState: Object.fromEntries(byPaymentState.map((p) => [p.paymentState, p._count.id]))
    });
  });
}
