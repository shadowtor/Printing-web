import prisma from "../db/client.js";
import type { ProductTemplate, Model } from "../../prisma/generated/prisma/client/client.js";

export type { ProductTemplate, Model };

export interface ProductTemplateCreateInput {
  name: string;
  description: string;
  active?: boolean;
}

export interface ProductTemplateUpdateInput {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface ModelCreateInput {
  productTemplateId: string;
  fileKey: string;
  format: string;
  displayName: string;
}

/**
 * Get all product templates
 */
export async function listProductTemplates(activeOnly = true): Promise<ProductTemplate[]> {
  return prisma.productTemplate.findMany({
    where: activeOnly ? { active: true } : undefined,
    include: {
      models: true,
      pricingProfiles: {
        where: { active: true }
      }
    }
  });
}

/**
 * Get a product template by ID
 */
export async function getProductTemplateById(id: string): Promise<ProductTemplate | null> {
  return prisma.productTemplate.findUnique({
    where: { id },
    include: {
      models: true,
      pricingProfiles: {
        where: { active: true },
        include: {
          rules: true
        }
      }
    }
  });
}

/**
 * Create a new product template
 */
export async function createProductTemplate(
  data: ProductTemplateCreateInput
): Promise<ProductTemplate> {
  return prisma.productTemplate.create({
    data
  });
}

/**
 * Update an existing product template
 */
export async function updateProductTemplate(
  id: string,
  data: ProductTemplateUpdateInput
): Promise<ProductTemplate> {
  return prisma.productTemplate.update({
    where: { id },
    data
  });
}

/**
 * Delete a product template (soft delete by setting active = false)
 */
export async function deleteProductTemplate(id: string): Promise<ProductTemplate> {
  return prisma.productTemplate.update({
    where: { id },
    data: { active: false }
  });
}

/**
 * Get a model by ID
 */
export async function getModelById(id: string): Promise<Model | null> {
  return prisma.model.findUnique({
    where: { id },
    include: {
      productTemplate: true
    }
  });
}

/**
 * Get all models for a product template
 */
export async function getModelsByTemplateId(productTemplateId: string): Promise<Model[]> {
  return prisma.model.findMany({
    where: { productTemplateId }
  });
}

/**
 * Create a new model
 */
export async function createModel(data: ModelCreateInput): Promise<Model> {
  return prisma.model.create({
    data
  });
}

/**
 * Delete a model
 */
export async function deleteModel(id: string): Promise<Model> {
  return prisma.model.delete({
    where: { id }
  });
}
