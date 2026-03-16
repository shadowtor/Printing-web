import prisma from "../db/client.js";
import type { Quote, Job } from "../../prisma/generated/prisma/client/client.js";

export type { Quote, Job };

export type QuoteStatus = "draft" | "locked";

export interface QuoteCreateInput {
  sessionId?: string;
  customerId?: string;
  status: QuoteStatus;
  totalPrice: number;
  currency: string;
  validUntil?: Date;
}

export interface QuoteUpdateInput {
  status?: QuoteStatus;
  totalPrice?: number;
  validUntil?: Date;
}

export interface JobCreateInput {
  quoteId: string;
  orderLineId?: string;
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  quantity: number;
  turnaroundProfileId?: string;
  unitPrice: number;
  feasibilityStatus?: string;
  leadTimeDays?: number;
}

export interface JobUpdateInput {
  orderLineId?: string;
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  quantity?: number;
  turnaroundProfileId?: string;
  unitPrice?: number;
  feasibilityStatus?: string;
  leadTimeDays?: number;
}

/**
 * Get quotes by session ID
 */
export async function getQuotesBySessionId(sessionId: string): Promise<Quote[]> {
  return prisma.quote.findMany({
    where: { sessionId },
    include: {
      jobs: true
    },
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Get quotes by customer ID
 */
export async function getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
  return prisma.quote.findMany({
    where: { customerId },
    include: {
      jobs: true
    },
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Get a quote by ID
 */
export async function getQuoteById(id: string): Promise<Quote | null> {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      jobs: true,
      customer: true
    }
  });
}

/**
 * Create a new quote
 */
export async function createQuote(data: QuoteCreateInput): Promise<Quote> {
  return prisma.quote.create({
    data
  });
}

/**
 * Update an existing quote
 */
export async function updateQuote(id: string, data: QuoteUpdateInput): Promise<Quote> {
  return prisma.quote.update({
    where: { id },
    data
  });
}

/**
 * Lock a quote (change status to 'locked')
 */
export async function lockQuote(id: string, validUntil?: Date): Promise<Quote> {
  return prisma.quote.update({
    where: { id },
    data: {
      status: "locked",
      validUntil
    }
  });
}

/**
 * Delete a quote
 */
export async function deleteQuote(id: string): Promise<Quote> {
  return prisma.quote.delete({
    where: { id }
  });
}

/**
 * Get a job by ID
 */
export async function getJobById(id: string): Promise<Job | null> {
  return prisma.job.findUnique({
    where: { id },
    include: {
      quote: true,
      orderLine: true
    }
  });
}

/**
 * Get all jobs for a quote
 */
export async function getJobsByQuoteId(quoteId: string): Promise<Job[]> {
  return prisma.job.findMany({
    where: { quoteId }
  });
}

/**
 * Create a new job
 */
export async function createJob(data: JobCreateInput): Promise<Job> {
  return prisma.job.create({
    data
  });
}

/**
 * Update an existing job
 */
export async function updateJob(id: string, data: JobUpdateInput): Promise<Job> {
  return prisma.job.update({
    where: { id },
    data
  });
}

/**
 * Delete a job
 */
export async function deleteJob(id: string): Promise<Job> {
  return prisma.job.delete({
    where: { id }
  });
}

/**
 * Calculate quote total from jobs
 */
export function calculateQuoteTotal(jobs: Job[]): number {
  return jobs.reduce((total, job) => total + job.unitPrice * job.quantity, 0);
}
