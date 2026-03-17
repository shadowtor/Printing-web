import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  ADMIN_SECRET: z.string().optional(),
  CONNECTOR_API_URL: z.string().url().optional(),
  CONNECTOR_API_KEY: z.string().optional(),
  CONNECTOR_WEBHOOK_SECRET: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  PORT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .default("3000")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // In a real app we might pretty-print errors; here we fail fast.
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration", parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;

