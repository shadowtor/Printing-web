import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import prisma from "../../src/db/client.js";
import { buildServer } from "../../src/api/server.js";
import { createQuoteWithEstimatedJobs } from "../../src/services/quote-service.js";
import { lockQuote } from "../../src/models/quote.js";

let app: FastifyInstance;
let pricingProfileId: string;
let quoteId: string;
let jobId: string;
const sessionId = "test-session-checkout-" + Date.now();

beforeAll(async () => {
  app = await buildServer();
  await app.ready();

  const productTemplate = await prisma.productTemplate.create({
    data: {
      name: "Checkout Test Template",
      description: "For checkout integration tests",
      active: true
    }
  });

  const pricingProfile = await prisma.pricingProfile.create({
    data: {
      name: "Checkout Pricing",
      productTemplateId: productTemplate.id,
      active: true
    }
  });
  pricingProfileId = pricingProfile.id;

  await prisma.quoteRule.create({
    data: {
      pricingProfileId: pricingProfile.id,
      materialId: null,
      qualityId: null,
      toleranceClassId: null,
      turnaroundProfileId: null,
      unitPrice: 500,
      currency: "AUD",
      feasibilityRule: "always_ok",
      leadTimeDays: 3,
      minQuantity: 1,
      maxQuantity: null,
      materialRecommendations: null
    }
  });

  await prisma.paymentMethodConfig.upsert({
    where: { method: "cash" },
    create: { method: "cash", enabled: true, sortOrder: 0 },
    update: { enabled: true }
  });

  const { quoteId: qid, jobIds } = await createQuoteWithEstimatedJobs({
    sessionId,
    currency: "AUD",
    jobs: [{ pricingProfileId, quantity: 2 }]
  });
  quoteId = qid;
  jobId = jobIds[0]!;
  await lockQuote(quoteId);
});

afterAll(async () => {
  await prisma.auditEvent.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartLine.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.paymentMethodConfig.deleteMany();
  await prisma.quoteRule.deleteMany();
  await prisma.pricingProfile.deleteMany();
  await prisma.productTemplate.deleteMany();
  await app.close();
  await prisma.$disconnect();
});

describe("cart and checkout routes", () => {
  it("GET /api/v1/cart returns empty or cart with totals", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/cart",
      query: { sessionId }
    });
    expect(response.statusCode).toBe(200);
    const json = response.json() as {
      cart: unknown;
      lines: unknown[];
      totalItems: number;
      totalCents: number;
      currency: string;
    };
    expect(typeof json.totalItems).toBe("number");
    expect(typeof json.totalCents).toBe("number");
  });

  it("POST /api/v1/cart/lines adds locked quote job to cart", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/cart/lines",
      payload: { sessionId, quoteId, jobId, quantity: 2 },
      headers: { "content-type": "application/json" }
    });
    expect(response.statusCode).toBe(201);
    const line = response.json() as {
      id: string;
      cartId: string;
      quoteId: string;
      jobId: string;
      quantity: number;
      lockedUnitPrice: number;
      currency: string;
    };
    expect(line.quoteId).toBe(quoteId);
    expect(line.jobId).toBe(jobId);
    expect(line.quantity).toBe(2);
    expect(line.lockedUnitPrice).toBe(500);
    expect(line.currency).toBe("AUD");
  });

  it("GET /api/v1/cart returns cart with lines and totals", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/cart",
      query: { sessionId }
    });
    expect(response.statusCode).toBe(200);
    const json = response.json() as {
      cart: { id: string; lines: unknown[] };
      lines: unknown[];
      totalItems: number;
      totalCents: number;
      currency: string;
    };
    expect(json.lines.length).toBe(1);
    expect(json.totalItems).toBe(2);
    expect(json.totalCents).toBe(1000);
    expect(json.currency).toBe("AUD");
  });

  it("GET /api/v1/checkout/payment-methods returns enabled methods", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/checkout/payment-methods"
    });
    expect(response.statusCode).toBe(200);
    const methods = response.json() as Array<{ method: string; sortOrder: number }>;
    expect(Array.isArray(methods)).toBe(true);
    const cash = methods.find((m) => m.method === "cash");
    expect(cash).toBeDefined();
  });

  it("POST /api/v1/checkout creates order and clears cart", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/checkout",
      payload: { sessionId, paymentMethod: "cash", guestEmail: "guest@example.com" },
      headers: { "content-type": "application/json" }
    });
    expect(response.statusCode).toBe(201);
    const json = response.json() as { orderId: string; orderNumber: string };
    expect(json.orderId).toBeDefined();
    expect(json.orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]+$/);

    const cartResponse = await app.inject({
      method: "GET",
      url: "/api/v1/cart",
      query: { sessionId }
    });
    const cartJson = cartResponse.json() as { lines: unknown[]; totalItems: number };
    expect(cartJson.lines.length).toBe(0);
    expect(cartJson.totalItems).toBe(0);
  });

  it("POST /api/v1/checkout with empty cart returns 400", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/checkout",
      payload: { sessionId, paymentMethod: "cash" },
      headers: { "content-type": "application/json" }
    });
    expect(response.statusCode).toBe(400);
    const json = response.json() as { code: string };
    expect(json.code).toBe("CART_EMPTY");
  });

  it("POST /api/v1/checkout with disabled payment method returns 400", async () => {
    await prisma.paymentMethodConfig.updateMany({
      where: { method: "stripe" },
      data: { enabled: false }
    });
    const stripeConfig = await prisma.paymentMethodConfig.findUnique({
      where: { method: "stripe" }
    });
    if (!stripeConfig) {
      await prisma.paymentMethodConfig.create({
        data: { method: "stripe", enabled: false, sortOrder: 1 }
      });
    }

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/checkout",
      payload: { sessionId, paymentMethod: "stripe" },
      headers: { "content-type": "application/json" }
    });
    expect(response.statusCode).toBe(400);
    const json = response.json() as { code: string };
    expect(json.code).toBe("PAYMENT_METHOD_DISABLED");
  });
});
