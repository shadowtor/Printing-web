import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../../config/index.js";
import { rateLimitCheck } from "../../lib/cache.js";

const WINDOW_SECONDS = 60;

const LIMITS = {
  /** Storefront: catalog, quote, cart, checkout, upload, auth */
  storefront: 200,
  /** Admin routes */
  admin: 300,
  /** Webhooks: Stripe, PayPal, connector */
  webhooks: 100
} as const;

function getIdentifier(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) {
    const first = typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded[0];
    if (first) return first.trim();
  }
  return request.ip ?? "unknown";
}

function getLimitForUrl(url: string): number | null {
  if (url === "/health" || url.startsWith("/health")) return null;
  if (url.startsWith("/api/v1/admin")) return LIMITS.admin;
  if (url.startsWith("/api/v1/webhooks")) return LIMITS.webhooks;
  return LIMITS.storefront;
}

export async function registerRateLimit(app: FastifyInstance) {
  if (!env.REDIS_URL) return;

  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const limit = getLimitForUrl(request.url);
    if (limit === null) return;
    const identifier = getIdentifier(request);
    const { allowed, retryAfter } = await rateLimitCheck(identifier, limit, WINDOW_SECONDS);
    if (!allowed) {
      return reply.status(429).header("Retry-After", String(retryAfter)).send({
        code: "rate_limit_exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter
      });
    }
  });
}
