import type { FastifyInstance } from "fastify";
import {
  listPricingProfiles,
  getPricingProfileById,
  createPricingProfile,
  updatePricingProfile,
  deletePricingProfile,
  getQuoteRuleById,
  createQuoteRule,
  updateQuoteRule,
  deleteQuoteRule,
  type PricingProfileCreateInput,
  type PricingProfileUpdateInput,
  type QuoteRuleCreateInput,
  type QuoteRuleUpdateInput
} from "../../../models/pricing.js";
import { requireAdmin } from "../../middleware/admin-auth.js";
import { cacheInvalidatePrefix } from "../../../lib/cache.js";

const prefix = "/api/v1/admin";

const preHandler = [requireAdmin];

export async function registerAdminPricingRoutes(app: FastifyInstance) {
  app.get(`${prefix}/pricing/profiles`, { preHandler }, async (_request, reply) => {
    const profiles = await listPricingProfiles(false);
    return reply.send(profiles);
  });

  app.get<{ Params: { id: string } }>(`${prefix}/pricing/profiles/:id`, { preHandler }, async (request, reply) => {
    const profile = await getPricingProfileById(request.params.id);
    if (!profile) return reply.status(404).send({ code: "not_found", message: "Pricing profile not found." });
    return reply.send(profile);
  });

  app.post<{ Body: PricingProfileCreateInput }>(`${prefix}/pricing/profiles`, { preHandler }, async (request, reply) => {
    const body = request.body ?? {};
    if (!body.name) {
      return reply.status(400).send({ code: "invalid_request", message: "name is required." });
    }
    const profile = await createPricingProfile(body);
    await cacheInvalidatePrefix("pricing");
    return reply.status(201).send(profile);
  });

  app.patch<{ Params: { id: string }; Body: PricingProfileUpdateInput }>(
    `${prefix}/pricing/profiles/:id`,
    { preHandler },
    async (request, reply) => {
      const profile = await updatePricingProfile(request.params.id, request.body ?? {});
      await cacheInvalidatePrefix("pricing");
      return reply.send(profile);
    }
  );

  app.delete<{ Params: { id: string } }>(`${prefix}/pricing/profiles/:id`, { preHandler }, async (request, reply) => {
    await deletePricingProfile(request.params.id);
    await cacheInvalidatePrefix("pricing");
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>(`${prefix}/pricing/rules/:id`, { preHandler }, async (request, reply) => {
    const rule = await getQuoteRuleById(request.params.id);
    if (!rule) return reply.status(404).send({ code: "not_found", message: "Quote rule not found." });
    return reply.send(rule);
  });

  app.post<{ Body: QuoteRuleCreateInput }>(`${prefix}/pricing/rules`, { preHandler }, async (request, reply) => {
    const body = request.body ?? {};
    if (!body.pricingProfileId || body.unitPrice == null || !body.currency || !body.feasibilityRule || body.leadTimeDays == null) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "pricingProfileId, unitPrice, currency, feasibilityRule, and leadTimeDays are required."
      });
    }
    const rule = await createQuoteRule(body);
    await cacheInvalidatePrefix("pricing");
    return reply.status(201).send(rule);
  });

  app.patch<{ Params: { id: string }; Body: QuoteRuleUpdateInput }>(
    `${prefix}/pricing/rules/:id`,
    { preHandler },
    async (request, reply) => {
      const rule = await updateQuoteRule(request.params.id, request.body ?? {});
      await cacheInvalidatePrefix("pricing");
      return reply.send(rule);
    }
  );

  app.delete<{ Params: { id: string } }>(`${prefix}/pricing/rules/:id`, { preHandler }, async (request, reply) => {
    await deleteQuoteRule(request.params.id);
    await cacheInvalidatePrefix("pricing");
    return reply.status(204).send();
  });
}
