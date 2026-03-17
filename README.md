# Printing-web

A 3D printing commerce platform for home and small business: storefront (catalog, upload & quote, cart, checkout), customer account (orders, approvals, revisions, guest linking), and admin/ops (catalog, pricing, payment methods, orders, production queues, analytics, env/backup stubs). Planned: Bambu Lab connector service.

**What it does:**

- Browse catalog and request quotes (including “upload my file”); add locked quotes to cart and checkout.
- Guest and registered orders; link guest orders to an account by email.
- Customer order history, approval/revision/reprint requests, and project workspaces with comments.
- Admin: catalog items, product templates and models, pricing profiles and quote rules, payment method config, order management, production queues, printer-assignment payload for production, analytics summary, env validation and backup stub.

**Current state:** Phase 1 (“playground”). Backend: Node 24, Fastify, Prisma, PostgreSQL. Frontend: Next.js 15. Auth: customer JWT and admin secret (`Bearer admin:<ADMIN_SECRET>`). Stripe and PayPal are optional. Not all features are fully wired for production.

**Tech stack:** Node.js 24 LTS, Fastify, Prisma, Next.js 15, PostgreSQL.

---

## Documentation

- **[Install and run](docs/install-and-run.md)** — Prerequisites, environment variables, Docker Compose and local run, migrations, backup/restore, and connector boundary.
- **[Database overview](docs/database.md)** — Schema breakdown, model relationships, and main flows (cart/checkout, quote lock, production).
- **[Performance](docs/performance.md)** — Targets (quote p95, checkout UX), profiling, and hardening.
- **[Quickstart](specs/001-playground-phase1/quickstart.md)** — Short path to run the app with Docker and run smoke tests.

---

Inspired by and informed by several excellent open projects, including:

- MakerWorks Storefront (`mkw2`) — production-grade 3D printing storefront and ops backend.
- Bambuddy — self-hosted print archive and management for Bambu Lab printers.
- OrderWorks — order/queue dashboard layered on top of MakerWorks.
- StockWorks — inventory and material tracking for 3D printing shops.

This project aims to build a similar end-to-end experience tailored for a home-business 3D printing commerce platform, with a future Bambu connector service.

---

## License

- **Personal use:** You may use this project for personal use only. You must give clear attribution to the project and the author (shadowtor).
- **Commercial use:** Commercial use (including internal business use beyond personal) requires prior approval from the developer (shadowtor) and may require a licensing fee. Contact the developer for permission before any commercial use.
