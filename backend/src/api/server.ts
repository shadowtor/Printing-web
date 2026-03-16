import Fastify from "fastify";
import { env } from "../config/index.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { registerAuthHooks } from "./middleware/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerCatalogRoutes } from "./routes/catalog.js";
import { registerQuoteRoutes } from "./routes/quote.js";
import { registerCartRoutes } from "./routes/cart.js";
import { registerCheckoutRoutes } from "./routes/checkout.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerCustomerOrdersRoutes } from "./routes/customer-orders.js";
import { registerOrderRequestsRoutes } from "./routes/order-requests.js";
import { registerWorkspaceRoutes } from "./routes/workspace.js";
import { registerGuestLinkRoutes } from "./routes/guest-link.js";
import { registerAdminCatalogRoutes } from "./routes/admin/catalog.js";
import { registerAdminPricingRoutes } from "./routes/admin/pricing.js";
import { registerAdminPaymentMethodsRoutes } from "./routes/admin/payment-methods.js";
import { registerAdminOrdersRoutes } from "./routes/admin/orders.js";
import { registerAdminQueuesRoutes } from "./routes/admin/queues.js";
import { registerAdminAnalyticsRoutes } from "./routes/admin/analytics.js";
import { registerAdminOpsRoutes } from "./routes/admin/ops.js";

export async function buildServer() {
  const app = Fastify({
    logger: true
  });

  await registerErrorHandler(app);
  await registerAuthHooks(app);

  await registerHealthRoutes(app);
  await registerCatalogRoutes(app);
  await registerQuoteRoutes(app);
  await registerCartRoutes(app);
  await registerCheckoutRoutes(app);
  await registerWebhookRoutes(app);
  await registerAuthRoutes(app);
  await registerCustomerOrdersRoutes(app);
  await registerOrderRequestsRoutes(app);
  await registerWorkspaceRoutes(app);
  await registerGuestLinkRoutes(app);

  await registerAdminCatalogRoutes(app);
  await registerAdminPricingRoutes(app);
  await registerAdminPaymentMethodsRoutes(app);
  await registerAdminOrdersRoutes(app);
  await registerAdminQueuesRoutes(app);
  await registerAdminAnalyticsRoutes(app);
  await registerAdminOpsRoutes(app);

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

