import type { FastifyInstance } from "fastify";
import {
  listPaymentMethodConfigs,
  getPaymentMethodConfigByMethod,
  updatePaymentMethodConfig,
  upsertPaymentMethodConfig
} from "../../../models/payment-method-config.js";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";

const preHandler = [requireAdmin];

export async function registerAdminPaymentMethodsRoutes(app: FastifyInstance) {
  app.get(`${prefix}/payment-methods`, { preHandler }, async (_request, reply) => {
    const methods = await listPaymentMethodConfigs();
    return reply.send(methods);
  });

  app.get<{ Params: { method: string } }>(`${prefix}/payment-methods/:method`, { preHandler }, async (request, reply) => {
    const config = await getPaymentMethodConfigByMethod(request.params.method);
    if (!config) return reply.status(404).send({ code: "not_found", message: "Payment method not found." });
    return reply.send(config);
  });

  app.patch<{
    Params: { method: string };
    Body: { enabled?: boolean; sortOrder?: number; configJson?: object | null };
  }>(`${prefix}/payment-methods/:method`, { preHandler }, async (request, reply) => {
    const config = await getPaymentMethodConfigByMethod(request.params.method);
    if (!config) return reply.status(404).send({ code: "not_found", message: "Payment method not found." });
    const updated = await updatePaymentMethodConfig(config.id, request.body ?? {});
    return reply.send(updated);
  });

  app.put<{
    Params: { method: string };
    Body: { enabled?: boolean; sortOrder?: number; configJson?: object | null };
  }>(`${prefix}/payment-methods/:method`, { preHandler }, async (request, reply) => {
    const updated = await upsertPaymentMethodConfig({
      method: request.params.method,
      ...request.body
    });
    return reply.send(updated);
  });
}
