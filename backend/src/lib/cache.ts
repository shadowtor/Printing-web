import { Redis } from "ioredis";
import { env } from "../config/index.js";

const PREFIX = "pw:";

let client: Redis | null = null;

function getClient(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (client) return client;
  try {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });
    client.on("error", () => {
      // Connection errors: treat as cache miss in get/set/del
    });
    return client;
  } catch {
    return null;
  }
}

/**
 * Get a value from cache. Returns null on miss or when Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(PREFIX + key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in cache with TTL. No-op when Redis is unavailable.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const serialized = JSON.stringify(value);
    await redis.set(PREFIX + key, serialized, "EX", ttlSeconds);
  } catch {
    // no-op
  }
}

/**
 * Delete a single key. No-op when Redis is unavailable.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(PREFIX + key);
  } catch {
    // no-op
  }
}

/**
 * Delete all keys matching the given prefix (e.g. "catalog" -> "pw:catalog:*").
 * No-op when Redis is unavailable.
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const pattern = PREFIX + prefix + "*";
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // no-op
  }
}

/**
 * Close the Redis connection. Call on app shutdown if needed.
 */
export async function cacheClose(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

/**
 * Rate limit check: increment counter for identifier in current window; returns whether request is allowed.
 * Uses fixed window. No-op when Redis unavailable (allowed).
 */
export async function rateLimitCheck(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const redis = getClient();
  if (!redis) return { allowed: true, retryAfter: windowSeconds };
  const window = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const key = `${PREFIX}ratelimit:${identifier}:${window}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds + 60);
    return {
      allowed: count <= limit,
      retryAfter: windowSeconds
    };
  } catch {
    return { allowed: true, retryAfter: windowSeconds };
  }
}

export const CACHE_TTL = {
  CATALOG_SECONDS: 300,
  PRICING_SECONDS: 300,
  CONNECTOR_STATUS_SECONDS: 30
} as const;

/** Use with cacheGet/cacheSet for connector printer/queue status when an admin endpoint is added. */
export const CONNECTOR_STATUS_CACHE_KEY = "connector:status";
