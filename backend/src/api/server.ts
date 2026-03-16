import Fastify from "fastify";
import { env } from "../config/index.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { registerAuthHooks } from "./middleware/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerCatalogRoutes } from "./routes/catalog.js";
import { registerQuoteRoutes } from "./routes/quote.js";

export async function buildServer() {
  const app = Fastify({
    logger: true
  });

  await registerErrorHandler(app);
  await registerAuthHooks(app);

  await registerHealthRoutes(app);
  await registerCatalogRoutes(app);
  await registerQuoteRoutes(app);

  return app;
}

export async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Started directly with node dist/api/server.js
  void start();
}

