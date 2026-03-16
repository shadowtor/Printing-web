import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import prisma from "../../src/db/client.js";
import { buildServer } from "../../src/api/server.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildServer();
  await app.ready();

  // Minimal seed data for pricing / quote estimation
  const productTemplate = await prisma.productTemplate.create({
    data: {
      name: "Test Template",
      description: "Template for integration tests",
      active: true
    }
  });

  const pricingProfile = await prisma.pricingProfile.create({
    data: {
      name: "Default Pricing",
      productTemplateId: productTemplate.id,
      active: true
    }
  });

  await prisma.quoteRule.create({
    data: {
      pricingProfileId: pricingProfile.id,
      materialId: null,
      qualityId: null,
      toleranceClassId: null,
      turnaroundProfileId: null,
      unitPrice: 1000,
      currency: "AUD",
      feasibilityRule: "always_ok",
      leadTimeDays: 5,
      minQuantity: 1,
      maxQuantity: null,
      materialRecommendations: "PLA recommended"
    }
  });
});

afterAll(async () => {
  await app.close();
  await prisma.quoteRule.deleteMany();
  await prisma.pricingProfile.deleteMany();
  await prisma.productTemplate.deleteMany();
  await prisma.$disconnect();
});

describe("upload and quote routes", () => {
  it("POST /upload accepts a valid file and returns a fileKey", async () => {
    const body = {
      filename: "part.stl",
      contentBase64: Buffer.from("solid test\nendsolid test\n").toString("base64")
    };

    const response = await app.inject({
      method: "POST",
      url: "/upload",
      payload: body
    });

    expect(response.statusCode).toBe(200);
    const json = response.json() as { fileKey: string; bytesWritten: number };
    expect(typeof json.fileKey).toBe("string");
    expect(json.fileKey.endsWith(".stl")).toBe(true);
    expect(json.bytesWritten).toBeGreaterThan(0);
  });

  it("POST /upload rejects invalid extension", async () => {
    const body = {
      filename: "malicious.exe",
      contentBase64: Buffer.from("test").toString("base64")
    };

    const response = await app.inject({
      method: "POST",
      url: "/upload",
      payload: body
    });

    expect(response.statusCode).toBe(400);
    const json = response.json() as { code: string; reason: string };
    expect(json.code).toBe("upload_validation_error");
    expect(json.reason).toBe("EXTENSION");
  });

  it("POST /quote/estimate returns pricing, feasibility, and lead time", async () => {
    const pricingProfile = await prisma.pricingProfile.findFirstOrThrow();

    const body = {
      currency: "AUD",
      jobs: [
        {
          pricingProfileId: pricingProfile.id,
          quantity: 2
        }
      ]
    };

    const response = await app.inject({
      method: "POST",
      url: "/quote/estimate",
      payload: body
    });

    expect(response.statusCode).toBe(200);
    const json = response.json() as {
      currency: string;
      totalPrice: number;
      jobs: Array<{
        unitPrice: number;
        totalPrice: number;
        feasibilityStatus: string;
        leadTimeDays: number;
      }>;
    };

    expect(json.currency).toBe("AUD");
    expect(json.totalPrice).toBeGreaterThan(0);
    expect(json.jobs).toHaveLength(1);
    expect(json.jobs[0].feasibilityStatus).toBeTypeOf("string");
    expect(json.jobs[0].leadTimeDays).toBeGreaterThan(0);
  });

  it("POST /quote/estimate validates request body", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/quote/estimate",
      payload: {}
    });

    expect(response.statusCode).toBe(400);
  });

  it("POST /quote/lock locks an existing quote", async () => {
    const pricingProfile = await prisma.pricingProfile.findFirstOrThrow();

    const estimateBody = {
      currency: "AUD",
      jobs: [
        {
          pricingProfileId: pricingProfile.id,
          quantity: 1
        }
      ]
    };

    const estimateResponse = await app.inject({
      method: "POST",
      url: "/quote/estimate",
      payload: estimateBody
    });

    expect(estimateResponse.statusCode).toBe(200);

    const quote = await prisma.quote.create({
      data: {
        status: "draft",
        totalPrice: (estimateResponse.json() as { totalPrice: number }).totalPrice,
        currency: "AUD"
      }
    });

    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const lockResponse = await app.inject({
      method: "POST",
      url: "/quote/lock",
      payload: {
        quoteId: quote.id,
        validUntil
      }
    });

    expect(lockResponse.statusCode).toBe(200);
    const locked = lockResponse.json() as { status: string; validUntil: string | null };
    expect(locked.status).toBe("locked");
    expect(locked.validUntil).not.toBeNull();
  });
});

