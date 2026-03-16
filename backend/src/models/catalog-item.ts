import prisma from "../db/client.js";
import type { CatalogItem } from "../../prisma/generated/prisma/client/client.js";

export type { CatalogItem };

export interface CatalogItemCreateInput {
  slug: string;
  name: string;
  description: string;
  featured?: boolean;
  sortOrder?: number;
  active?: boolean;
  imageUrl?: string;
  productTemplateId?: string;
}

export interface CatalogItemUpdateInput {
  slug?: string;
  name?: string;
  description?: string;
  featured?: boolean;
  sortOrder?: number;
  active?: boolean;
  imageUrl?: string;
  productTemplateId?: string;
}

/**
 * Get all active catalog items, ordered by sortOrder
 */
export async function listCatalogItems(activeOnly = true): Promise<CatalogItem[]> {
  return prisma.catalogItem.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      productTemplate: true
    }
  });
}

/**
 * Get a catalog item by slug
 */
export async function getCatalogItemBySlug(slug: string): Promise<CatalogItem | null> {
  return prisma.catalogItem.findUnique({
    where: { slug },
    include: {
      productTemplate: {
        include: {
          models: true,
          pricingProfiles: {
            where: { active: true },
            include: {
              rules: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get a catalog item by ID
 */
export async function getCatalogItemById(id: string): Promise<CatalogItem | null> {
  return prisma.catalogItem.findUnique({
    where: { id },
    include: {
      productTemplate: true
    }
  });
}

/**
 * Create a new catalog item
 */
export async function createCatalogItem(data: CatalogItemCreateInput): Promise<CatalogItem> {
  return prisma.catalogItem.create({
    data
  });
}

/**
 * Update an existing catalog item
 */
export async function updateCatalogItem(
  id: string,
  data: CatalogItemUpdateInput
): Promise<CatalogItem> {
  return prisma.catalogItem.update({
    where: { id },
    data
  });
}

/**
 * Delete a catalog item (soft delete by setting active = false)
 */
export async function deleteCatalogItem(id: string): Promise<CatalogItem> {
  return prisma.catalogItem.update({
    where: { id },
    data: { active: false }
  });
}
