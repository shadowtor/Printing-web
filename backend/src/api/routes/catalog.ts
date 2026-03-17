import type { FastifyInstance } from "fastify";
import { listCatalogItems, getCatalogItemBySlug } from "../../models/catalog-item.js";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "../../lib/cache.js";

const CATALOG_LIST_KEY = "catalog:items:active";

export async function registerCatalogRoutes(app: FastifyInstance) {
  /** GET /api/v1/catalog/items — list active catalog items, ordered by sortOrder */
  app.get("/api/v1/catalog/items", async (_request, reply) => {
    const cached = await cacheGet<Awaited<ReturnType<typeof listCatalogItems>>>(CATALOG_LIST_KEY);
    if (cached != null) return reply.send(cached);
    const items = await listCatalogItems(true);
    await cacheSet(CATALOG_LIST_KEY, items, CACHE_TTL.CATALOG_SECONDS);
    return reply.send(items);
  });

  /** GET /api/v1/catalog/items/:slug — get a single catalog item by slug (with productTemplate, models, pricingProfiles) */
  app.get<{ Params: { slug: string } }>("/api/v1/catalog/items/:slug", async (request, reply) => {
    const { slug } = request.params;
    const cacheKey = `catalog:item:${slug}`;
    const cached = await cacheGet<Awaited<ReturnType<typeof getCatalogItemBySlug>>>(cacheKey);
    if (cached != null) return reply.send(cached);
    const item = await getCatalogItemBySlug(slug);
    if (item == null) {
      return reply.status(404).send({
        code: "not_found",
        message: `Catalog item with slug "${slug}" not found`
      });
    }
    await cacheSet(cacheKey, item, CACHE_TTL.CATALOG_SECONDS);
    return reply.send(item);
  });
}
