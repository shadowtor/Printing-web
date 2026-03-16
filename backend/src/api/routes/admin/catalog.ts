import type { FastifyInstance } from "fastify";
import {
  listCatalogItems,
  getCatalogItemById,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  type CatalogItemCreateInput,
  type CatalogItemUpdateInput
} from "../../../models/catalog-item.js";
import {
  listProductTemplates,
  getProductTemplateById,
  createProductTemplate,
  updateProductTemplate,
  deleteProductTemplate,
  createModel,
  getModelsByTemplateId,
  deleteModel,
  type ProductTemplateCreateInput,
  type ProductTemplateUpdateInput,
  type ModelCreateInput
} from "../../../models/product-template.js";
import { requireAdmin } from "../../middleware/admin-auth.js";

const prefix = "/api/v1/admin";

const preHandler = [requireAdmin];

export async function registerAdminCatalogRoutes(app: FastifyInstance) {
  app.get(`${prefix}/catalog/items`, { preHandler }, async (_request, reply) => {
    const items = await listCatalogItems(false);
    return reply.send(items);
  });

  app.get<{ Params: { id: string } }>(`${prefix}/catalog/items/:id`, { preHandler }, async (request, reply) => {
    const item = await getCatalogItemById(request.params.id);
    if (!item) return reply.status(404).send({ code: "not_found", message: "Catalog item not found." });
    return reply.send(item);
  });

  app.post<{ Body: CatalogItemCreateInput }>(`${prefix}/catalog/items`, { preHandler }, async (request, reply) => {
    const body = request.body ?? {};
    if (!body.slug || !body.name || !body.description) {
      return reply.status(400).send({ code: "invalid_request", message: "slug, name, and description are required." });
    }
    const item = await createCatalogItem(body);
    return reply.status(201).send(item);
  });

  app.patch<{ Params: { id: string }; Body: CatalogItemUpdateInput }>(
    `${prefix}/catalog/items/:id`,
    { preHandler },
    async (request, reply) => {
      const item = await updateCatalogItem(request.params.id, request.body ?? {});
      return reply.send(item);
    }
  );

  app.delete<{ Params: { id: string } }>(`${prefix}/catalog/items/:id`, { preHandler }, async (request, reply) => {
    await deleteCatalogItem(request.params.id);
    return reply.status(204).send();
  });

  app.get(`${prefix}/product-templates`, { preHandler }, async (_request, reply) => {
    const templates = await listProductTemplates(false);
    return reply.send(templates);
  });

  app.get<{ Params: { id: string } }>(`${prefix}/product-templates/:id`, { preHandler }, async (request, reply) => {
    const template = await getProductTemplateById(request.params.id);
    if (!template) return reply.status(404).send({ code: "not_found", message: "Product template not found." });
    return reply.send(template);
  });

  app.post<{ Body: ProductTemplateCreateInput }>(`${prefix}/product-templates`, { preHandler }, async (request, reply) => {
    const body = request.body ?? {};
    if (!body.name || !body.description) {
      return reply.status(400).send({ code: "invalid_request", message: "name and description are required." });
    }
    const template = await createProductTemplate(body);
    return reply.status(201).send(template);
  });

  app.patch<{ Params: { id: string }; Body: ProductTemplateUpdateInput }>(
    `${prefix}/product-templates/:id`,
    { preHandler },
    async (request, reply) => {
      const template = await updateProductTemplate(request.params.id, request.body ?? {});
      return reply.send(template);
    }
  );

  app.delete<{ Params: { id: string } }>(`${prefix}/product-templates/:id`, { preHandler }, async (request, reply) => {
    await deleteProductTemplate(request.params.id);
    return reply.status(204).send();
  });

  app.get<{ Params: { templateId: string } }>(`${prefix}/product-templates/:templateId/models`, { preHandler }, async (request, reply) => {
    const models = await getModelsByTemplateId(request.params.templateId);
    return reply.send(models);
  });

  app.post<{ Params: { templateId: string }; Body: Omit<ModelCreateInput, "productTemplateId"> }>(
    `${prefix}/product-templates/:templateId/models`,
    { preHandler },
    async (request, reply) => {
      const body = request.body ?? {};
      if (!body.fileKey || !body.format || !body.displayName) {
        return reply.status(400).send({ code: "invalid_request", message: "fileKey, format, and displayName are required." });
      }
      const model = await createModel({
        productTemplateId: request.params.templateId,
        fileKey: body.fileKey,
        format: body.format,
        displayName: body.displayName
      });
      return reply.status(201).send(model);
    }
  );

  app.delete<{ Params: { templateId: string; modelId: string } }>(
    `${prefix}/product-templates/:templateId/models/:modelId`,
    { preHandler },
    async (request, reply) => {
      await deleteModel(request.params.modelId);
      return reply.status(204).send();
    }
  );
}
