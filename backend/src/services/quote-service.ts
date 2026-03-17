import type { QuoteRule } from "../models/pricing.js";
import { findMatchingQuoteRules } from "../models/pricing.js";
import { createJob, createQuote, updateQuote, type Job } from "../models/quote.js";
import { cacheGet, cacheSet, CACHE_TTL } from "../lib/cache.js";
import type { QuoteRuleQuery } from "../models/pricing.js";

/**
 * Input for estimating a single job line (one product configuration).
 */
export interface EstimateJobInput {
  pricingProfileId: string;
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  turnaroundProfileId?: string;
  quantity: number;
}

/**
 * Result of estimating one job: pricing, feasibility, and lead time.
 */
export interface EstimateJobResult {
  unitPrice: number;
  currency: string;
  feasibilityStatus: string;
  leadTimeDays: number;
  materialRecommendations: string | null;
  totalPrice: number;
  /** ID of the QuoteRule that was used (for audit). */
  ruleId: string;
}

/**
 * No matching quote rule found for the given options.
 */
export class NoMatchingQuoteRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoMatchingQuoteRuleError";
  }
}

/**
 * Find the best matching quote rule (most specific: most non-null criteria matched).
 * Returns the rule with the highest number of matching optional criteria.
 */
function pickBestRule(rules: QuoteRule[], input: EstimateJobInput): QuoteRule {
  if (rules.length === 0) {
    throw new NoMatchingQuoteRuleError(
      `No quote rule found for pricingProfileId=${input.pricingProfileId} with the given options.`
    );
  }

  const optionalFields = [
    input.materialId,
    input.qualityId,
    input.toleranceClassId,
    input.turnaroundProfileId
  ].filter(Boolean);

  const first = rules[0];
  if (!first) throw new NoMatchingQuoteRuleError("No quote rule found.");
  let best: QuoteRule = first;
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    if (input.materialId && rule.materialId === input.materialId) score++;
    if (input.qualityId && rule.qualityId === input.qualityId) score++;
    if (input.toleranceClassId && rule.toleranceClassId === input.toleranceClassId) score++;
    if (input.turnaroundProfileId && rule.turnaroundProfileId === input.turnaroundProfileId) score++;
    if (optionalFields.length > 0 && score > bestScore) {
      bestScore = score;
      best = rule;
    } else if (optionalFields.length === 0) {
      break;
    }
  }

  return best;
}

function pricingQueryCacheKey(query: QuoteRuleQuery): string {
  const canonical = {
    pricingProfileId: query.pricingProfileId,
    materialId: query.materialId ?? null,
    qualityId: query.qualityId ?? null,
    toleranceClassId: query.toleranceClassId ?? null,
    turnaroundProfileId: query.turnaroundProfileId ?? null,
    quantity: query.quantity ?? null
  };
  return `pricing:match:${JSON.stringify(canonical)}`;
}

/**
 * Estimate pricing, feasibility, and lead time for a single job line.
 * Uses the first matching QuoteRule (or best match when multiple match).
 */
export async function estimateJob(input: EstimateJobInput): Promise<EstimateJobResult> {
  const query: QuoteRuleQuery = {
    pricingProfileId: input.pricingProfileId,
    materialId: input.materialId,
    qualityId: input.qualityId,
    toleranceClassId: input.toleranceClassId,
    turnaroundProfileId: input.turnaroundProfileId,
    quantity: input.quantity
  };
  const cacheKey = pricingQueryCacheKey(query);
  let rules: QuoteRule[] | null = await cacheGet<QuoteRule[]>(cacheKey);
  if (rules == null) {
    rules = await findMatchingQuoteRules(query);
    await cacheSet(cacheKey, rules, CACHE_TTL.PRICING_SECONDS);
  }

  const rule = pickBestRule(rules, input);
  const totalPrice = rule.unitPrice * input.quantity;

  return {
    unitPrice: rule.unitPrice,
    currency: rule.currency,
    feasibilityStatus: rule.feasibilityRule,
    leadTimeDays: rule.leadTimeDays,
    materialRecommendations: rule.materialRecommendations ?? null,
    totalPrice,
    ruleId: rule.id
  };
}

/**
 * Input for creating a quote with one or more estimated jobs.
 */
export interface CreateQuoteWithJobsInput {
  sessionId?: string;
  customerId?: string;
  currency: string;
  jobs: Array<EstimateJobInput>;
}

/**
 * Create a draft quote and jobs with estimated unit price, feasibility, and lead time.
 * Total quote price is computed from the sum of (unitPrice * quantity) for each job.
 */
export async function createQuoteWithEstimatedJobs(
  input: CreateQuoteWithJobsInput
): Promise<{ quoteId: string; jobIds: string[]; totalPrice: number; jobs: Job[] }> {
  const jobs: Job[] = [];
  let totalPrice = 0;

  const quote = await createQuote({
    sessionId: input.sessionId,
    customerId: input.customerId,
    status: "draft",
    totalPrice: 0,
    currency: input.currency
  });

  for (const line of input.jobs) {
    const est = await estimateJob(line);
    const job = await createJob({
      quoteId: quote.id,
      materialId: line.materialId,
      qualityId: line.qualityId,
      toleranceClassId: line.toleranceClassId,
      quantity: line.quantity,
      turnaroundProfileId: line.turnaroundProfileId,
      unitPrice: est.unitPrice,
      feasibilityStatus: est.feasibilityStatus,
      leadTimeDays: est.leadTimeDays
    });
    jobs.push(job);
    totalPrice += est.totalPrice;
  }

  await updateQuote(quote.id, { totalPrice });

  return {
    quoteId: quote.id,
    jobIds: jobs.map((j) => j.id),
    totalPrice,
    jobs
  };
}

/**
 * Get the maximum lead time in days from a list of jobs (for quote summary).
 */
export function maxLeadTimeDays(jobs: Job[]): number {
  const days = jobs
    .map((j) => j.leadTimeDays)
    .filter((d): d is number => d != null);
  return days.length === 0 ? 0 : Math.max(...days);
}
