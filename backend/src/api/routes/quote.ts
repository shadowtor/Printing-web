import type { FastifyInstance } from "fastify";
import { Readable } from "node:stream";

import { saveUpload, UploadValidationError } from "../../services/upload-service.js";
import {
  estimateJob,
  createQuoteWithEstimatedJobs,
  type EstimateJobInput
} from "../../services/quote-service.js";
import { lockQuote } from "../../models/quote.js";

interface UploadBody {
  filename: string;
  contentBase64: string;
}

interface QuoteEstimateBody {
  currency: string;
  jobs: EstimateJobInput[];
}

interface QuoteCreateBody {
  sessionId?: string;
  currency: string;
  jobs: EstimateJobInput[];
}

interface QuoteLockBody {
  quoteId: string;
  validUntil?: string;
}

export async function registerQuoteRoutes(app: FastifyInstance) {
  /**
   * POST /upload
   *
   * Secure file upload endpoint.
   * Expects JSON body:
   * {
   *   "filename": "part.stl",
   *   "contentBase64": "<base64-encoded file contents>"
   * }
   */
  app.post<{ Body: UploadBody }>("/api/v1/upload", async (request, reply) => {
    const { filename, contentBase64 } = request.body;

    if (!filename || !contentBase64) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "Both filename and contentBase64 are required."
      });
    }

    const buffer = Buffer.from(contentBase64, "base64");

    try {
      const result = await saveUpload(Readable.from(buffer), filename, buffer.length);
      return reply.send({
        fileKey: result.fileKey,
        bytesWritten: result.bytesWritten
      });
    } catch (error) {
      if (error instanceof UploadValidationError) {
        return reply.status(400).send({
          code: "upload_validation_error",
          reason: error.code,
          message: error.message
        });
      }

      request.log.error({ err: error }, "Unexpected error in /upload");
      return reply.status(500).send({
        code: "upload_error",
        message: "Failed to save upload."
      });
    }
  });

  /**
   * POST /quote/estimate
   *
   * Estimate pricing, feasibility, and lead time for one or more jobs
   * without locking a quote.
   *
   * Body:
   * {
   *   "currency": "AUD",
   *   "jobs": [EstimateJobInput, ...]
   * }
   */
  app.post<{ Body: QuoteEstimateBody }>("/api/v1/quote/estimate", async (request, reply) => {
    const { currency, jobs } = request.body;

    if (!currency || !Array.isArray(jobs) || jobs.length === 0) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "currency and at least one job are required."
      });
    }

    try {
      const results = await Promise.all(jobs.map((job) => estimateJob(job)));
      const totalPrice = results.reduce((sum, r) => sum + r.totalPrice, 0);

      return reply.send({
        currency,
        totalPrice,
        jobs: results
      });
    } catch (error) {
      request.log.error({ err: error }, "Error estimating quote");
      return reply.status(500).send({
        code: "estimate_error",
        message: "Failed to estimate quote."
      });
    }
  });

  /**
   * POST /quote/create
   *
   * Create a draft quote with estimated jobs (persisted). Caller can then lock and add to cart.
   */
  app.post<{ Body: QuoteCreateBody }>("/api/v1/quote/create", async (request, reply) => {
    const { sessionId, currency, jobs } = request.body;

    if (!currency || !Array.isArray(jobs) || jobs.length === 0) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "currency and at least one job are required."
      });
    }

    try {
      const result = await createQuoteWithEstimatedJobs({
        sessionId,
        currency,
        jobs
      });
      return reply.status(201).send({
        quoteId: result.quoteId,
        jobIds: result.jobIds,
        totalPrice: result.totalPrice,
        currency
      });
    } catch (error) {
      request.log.error({ err: error }, "Error creating quote");
      return reply.status(500).send({
        code: "create_quote_error",
        message: "Failed to create quote."
      });
    }
  });

  /**
   * POST /quote/lock
   *
   * Lock an existing quote so pricing becomes immutable.
   *
   * Body:
   * {
   *   "quoteId": "<quote-id>",
   *   "validUntil": "2026-03-31T00:00:00.000Z" // optional ISO string
   * }
   */
  app.post<{ Body: QuoteLockBody }>("/api/v1/quote/lock", async (request, reply) => {
    const { quoteId, validUntil } = request.body;

    if (!quoteId) {
      return reply.status(400).send({
        code: "invalid_request",
        message: "quoteId is required."
      });
    }

    let validUntilDate: Date | undefined;
    if (validUntil) {
      const parsed = new Date(validUntil);
      if (Number.isNaN(parsed.getTime())) {
        return reply.status(400).send({
          code: "invalid_request",
          message: "validUntil must be a valid ISO date string."
        });
      }
      validUntilDate = parsed;
    }

    try {
      const quote = await lockQuote(quoteId, validUntilDate);
      return reply.send(quote);
    } catch (error) {
      request.log.error({ err: error }, "Error locking quote");
      return reply.status(500).send({
        code: "lock_error",
        message: "Failed to lock quote."
      });
    }
  });
}

