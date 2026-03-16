import type { FastifyInstance } from "fastify";
import { listCatalogItems, getCatalogItemBySlug } from "../../models/catalog-item.js";

export async function registerCatalogRoutes(app: FastifyInstance) {
  /** GET /api/v1/catalog/items — list active catalog items, ordered by sortOrder */
  app.get("/api/v1/catalog/items", async (_request, reply) => {
    const activeOnly = true;
    const items = await listCatalogItems(activeOnly);
    return reply.send(items);
  });

  /** GET /api/v1/catalog/items/:slug — get a single catalog item by slug (with productTemplate, models, pricingProfiles) */
  app.get<{ Params: { slug: string } }>("/api/v1/catalog/items/:slug", async (request, reply) => {
    const { slug } = request.params;
    const item = await getCatalogItemBySlug(slug);
    if (item == null) {
      return reply.status(404).send({
        code: "not_found",
        message: `Catalog item with slug "${slug}" not found`
      });
    }
    return reply.send(item);
  });
}
