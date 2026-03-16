# API and Service Contracts

This directory holds the interface contracts for Playground.au Phase 1.

- **public-api.md** — REST API for storefront and customer account (quote, cart, checkout, orders, approvals, revisions, workspaces).
- **admin-api.md** — REST API for admin and fulfillment (catalog, pricing, payment config, orders, queues, printer-assignment, analytics, backup/restore, env validation).
- **printer-job-bundle.md** — Schema and semantics of the printer-assignment payload for the future Bambu Lab connector (no direct printer telemetry or control in this phase).

All APIs use JSON request/response bodies unless noted. Authentication: session or JWT for customer; admin role required for admin endpoints. Errors return structured bodies with code and user-safe message (FR-022).
