# Admin API (Management & Fulfillment)

**Base path**: `/api/v1/admin` (or as configured).  
**Auth**: Admin or fulfillment role required. All mutations MUST be audited (actor, timestamp, outcome) per constitution.  
**Errors**: Same structure as public API; operator-safe details in logs.

---

## Catalog & Content

- `GET /admin/catalog/items` — List all catalog items (incl. inactive). Query: filters, sort.
- `POST /admin/catalog/items` — Create catalog item. Body: slug, name, description, productTemplateId, featured, sortOrder, defaultOptions?.
- `PATCH /admin/catalog/items/:id` — Update catalog item; audit event.
- `GET /admin/product-templates` — List product templates and linked models.
- `POST /admin/product-templates` — Create template; optional models (file refs).
- `PATCH /admin/product-templates/:id` — Update template or models; audit.
- `PATCH /admin/featured` — Set featured items/banners. Body: `{ catalogItemIds?, bannerIds? }`. Storefront reflects (FR-015).

---

## Pricing & Quote Rules

- `GET /admin/pricing-profiles` — List pricing profiles and rules.
- `POST /admin/pricing-profiles` — Create profile and rules (material, quality, turnaround → price, feasibility, lead time) (FR-016).
- `PATCH /admin/pricing-profiles/:id` — Update profile or rules; audit.

---

## Payment Method Config

- `GET /admin/payment-methods` — List methods and enabled state. Response: `[{ method, enabled, sortOrder }]`.
- `PATCH /admin/payment-methods` — Enable/disable methods. Body: `[{ method, enabled }]`. Audit; only enabled methods at checkout (FR-017).

---

## Orders & Lifecycle

- `GET /admin/orders` — List orders; filters (stage, payment state, date). Response: paginated orders with summary.
- `GET /admin/orders/:id` — Full order detail; lines, audit events, approval/revision/reprint requests.
- `PATCH /admin/orders/:id/lifecycle` — Transition stage. Body: `{ stage, note? }`. Validate allowed transition; write audit event (FR-018).
- `GET /admin/orders/:id/audit` — Audit events for this order.

---

## Production Queues & Printer Assignment

- `GET /admin/queues` — List production queues and items (queued, assigned, in progress, done).
- `POST /admin/queues` — Create queue. Body: name.
- `POST /admin/queues/:queueId/items` — Add order line(s) to queue. Body: `{ orderLineIds }`.
- `PATCH /admin/queues/items/:itemId` — Update item status (queued → assigned → in_progress → done).
- `POST /admin/queues/items/:itemId/prepare-printer-assignment` — Build and store printer job bundle per contract; set item as "assigned" or "ready for connector". Response: `{ payloadId, payload }` (FR-019). No outbound call to printer.

---

## Analytics

- `GET /admin/analytics/overview` — Summary: order counts, revenue, quote counts, fulfillment metrics (as defined in FR-020). Response: JSON metrics and optional time range.

---

## Backup, Restore & Environment

- `GET /admin/health` — Health and readiness (DB, storage). Response: `{ status, checks: { db, storage? } }`.
- `POST /admin/ops/validate-environment` — Run env validation (required vars, connectivity). Response: `{ valid, errors? }` (FR-020).
- Backup/restore: Documented procedures (e.g. pg_dump, volume backup); optional `POST /admin/ops/backup-trigger` that invokes documented script or returns instructions. Restore requires explicit confirmation and audit (FR-020).
