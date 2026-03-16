import prisma from "../db/client.js";
import type { PricingProfile, QuoteRule } from "../../prisma/generated/prisma/client/client.js";

export type { PricingProfile, QuoteRule };

export interface PricingProfileCreateInput {
  name: string;
  productTemplateId?: string;
  active?: boolean;
}

export interface PricingProfileUpdateInput {
  name?: string;
  productTemplateId?: string;
  active?: boolean;
}

export interface QuoteRuleCreateInput {
  pricingProfileId: string;
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  turnaroundProfileId?: string;
  unitPrice: number;
  currency: string;
  feasibilityRule: string;
  leadTimeDays: number;
  minQuantity?: number;
  maxQuantity?: number;
  materialRecommendations?: string;
}

export interface QuoteRuleUpdateInput {
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  turnaroundProfileId?: string;
  unitPrice?: number;
  currency?: string;
  feasibilityRule?: string;
  leadTimeDays?: number;
  minQuantity?: number;
  maxQuantity?: number;
  materialRecommendations?: string;
}

export interface QuoteRuleQuery {
  pricingProfileId: string;
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  turnaroundProfileId?: string;
  quantity?: number;
}

/**
 * Get all pricing profiles
 */
export async function listPricingProfiles(activeOnly = true): Promise<PricingProfile[]> {
  return prisma.pricingProfile.findMany({
    where: activeOnly ? { active: true } : undefined,
    include: {
      rules: true,
      productTemplate: true
    }
  });
}

/**
 * Get a pricing profile by ID
 */
export async function getPricingProfileById(id: string): Promise<PricingProfile | null> {
  return prisma.pricingProfile.findUnique({
    where: { id },
    include: {
      rules: true,
      productTemplate: true
    }
  });
}

/**
 * Create a new pricing profile
 */
export async function createPricingProfile(
  data: PricingProfileCreateInput
): Promise<PricingProfile> {
  return prisma.pricingProfile.create({
    data
  });
}

/**
 * Update an existing pricing profile
 */
export async function updatePricingProfile(
  id: string,
  data: PricingProfileUpdateInput
): Promise<PricingProfile> {
  return prisma.pricingProfile.update({
    where: { id },
    data
  });
}

/**
 * Delete a pricing profile (soft delete by setting active = false)
 */
export async function deletePricingProfile(id: string): Promise<PricingProfile> {
  return prisma.pricingProfile.update({
    where: { id },
    data: { active: false }
  });
}

/**
 * Find matching quote rules based on criteria
 * Returns the most specific match (most criteria matched)
 */
export async function findMatchingQuoteRules(query: QuoteRuleQuery): Promise<QuoteRule[]> {
  const where: {
    pricingProfileId: string;
    materialId?: string | null;
    qualityId?: string | null;
    toleranceClassId?: string | null;
    turnaroundProfileId?: string | null;
    AND?: Array<{
      OR?: Array<{
        minQuantity?: { lte: number } | null;
        maxQuantity?: { gte: number } | null;
      }>;
    }>;
  } = {
    pricingProfileId: query.pricingProfileId
  };

  // Add optional filters
  if (query.materialId) {
    where.materialId = query.materialId;
  }
  if (query.qualityId) {
    where.qualityId = query.qualityId;
  }
  if (query.toleranceClassId) {
    where.toleranceClassId = query.toleranceClassId;
  }
  if (query.turnaroundProfileId) {
    where.turnaroundProfileId = query.turnaroundProfileId;
  }

  // Add quantity range filter if provided
  if (query.quantity !== undefined) {
    where.AND = [
      {
        OR: [
          { minQuantity: { lte: query.quantity } },
          { minQuantity: null }
        ]
      },
      {
        OR: [
          { maxQuantity: { gte: query.quantity } },
          { maxQuantity: null }
        ]
      }
    ];
  }

  return prisma.quoteRule.findMany({
    where,
    include: {
      pricingProfile: true
    }
  });
}

/**
 * Get a quote rule by ID
 */
export async function getQuoteRuleById(id: string): Promise<QuoteRule | null> {
  return prisma.quoteRule.findUnique({
    where: { id },
    include: {
      pricingProfile: true
    }
  });
}

/**
 * Create a new quote rule
 */
export async function createQuoteRule(data: QuoteRuleCreateInput): Promise<QuoteRule> {
  return prisma.quoteRule.create({
    data
  });
}

/**
 * Update an existing quote rule
 */
export async function updateQuoteRule(
  id: string,
  data: QuoteRuleUpdateInput
): Promise<QuoteRule> {
  return prisma.quoteRule.update({
    where: { id },
    data
  });
}

/**
 * Delete a quote rule
 */
export async function deleteQuoteRule(id: string): Promise<QuoteRule> {
  return prisma.quoteRule.delete({
    where: { id }
  });
}
