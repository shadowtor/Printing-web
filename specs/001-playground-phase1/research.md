# Research: Playground.au Phase 1

**Feature**: 001-playground-phase1  
**Date**: 2025-03-16

All Technical Context items from the plan are resolved below. No NEEDS CLARIFICATION remain.

---

## Runtime & Database Versions

- **Decision**: Node.js 24 LTS (current LTS as of Oct 2025), PostgreSQL 18.
- **Rationale**: User requirement for "latest stable stack"; Node 24 LTS and PostgreSQL 18 are released and suitable for production. Node 24 LTS supported through Apr 2028; PostgreSQL 18 provides current features (AIO, uuidv7, etc.).
- **Alternatives considered**: Node 22 LTS if 24 unavailable in some environments; PostgreSQL 17 if 18 not yet in Docker images. Use version pins in Dockerfile and docker-compose for reproducibility.

---

## Backend Framework

- **Decision**: Fastify for the backend API.
- **Rationale**: TypeScript-first, performant, built-in schema validation (JSON Schema), plugin ecosystem (auth, multipart for file upload), explicit async. Aligns with strict typing and explicit error handling.
- **Alternatives considered**: Express — larger ecosystem but less strict typing and validation out of the box; Hono — lighter, good for edge; NestJS — more structure than needed for this scope.

---

## ORM / Database Access

- **Decision**: Prisma for PostgreSQL.
- **Rationale**: Type-safe client, migrations, good TypeScript inference, supports JSON/audit patterns; well documented for backup/restore (pg_dump compatible). Aligns with constitution (type safety, testability via abstracted I/O).
- **Alternatives considered**: Drizzle — lighter, SQL-like; raw pg — more control but more boilerplate. Prisma chosen for speed of development and strong typing.

---

## Frontend Framework

- **Decision**: Next.js (App Router) for both storefront and management UI, with strict TypeScript.
- **Rationale**: Single framework for SSR/storefront and admin; API routes can proxy to backend or backend remains sole API; good DX, production-grade. Separate routes/apps for storefront vs admin (or path-based) to keep boundaries clear.
- **Alternatives considered**: Remix — similar; Vite + React SPA — simpler but no SSR; separate React SPA for admin only — more repos/apps to maintain. Next.js chosen for one codebase, clear structure, and deployment flexibility.

---

## Secure File Upload (3D Formats)

- **Decision**: Validate by allowed extension whitelist + magic bytes/signatures where feasible; store under a non-executable, path-sanitized directory (no user-controlled paths); enforce max file and archive size; for ZIP, safe extraction (no path traversal, limit entries). Use a dedicated upload service with explicit error codes and user-safe messages.
- **Rationale**: Constitution and FR-005 require validation, no path traversal, no execution. STL/OBJ/3MF etc. have known magic bytes or structure; ZIP must be extracted safely. MIME from client is not trusted; server-side check required.
- **Alternatives considered**: Third-party virus scan — add later if required; storing in object storage (S3) — use for production scale with same validation at ingest.

---

## Stripe & PayPal Integration

- **Decision**: Stripe: Checkout Session or Payment Intents API; store idempotency keys; webhooks for payment_intent.succeeded and checkout.session.completed; reconcile with order state. PayPal: use PayPal JS SDK and server-side orders API; webhooks for order capture; same reconciliation pattern. Both enabled/disabled via admin config; when disabled, no SDK init and methods hidden at checkout.
- **Rationale**: FR-007, FR-017: optional providers, independently toggled. Idempotency and webhook reconciliation avoid double-charge and satisfy auditability.
- **Alternatives considered**: Stripe-only or PayPal-only — user required both optional; single "payment gateway" abstraction — keep both behind a small adapter so connector boundary is clear.

---

## Docker & Database Container

- **Decision**: docker-compose with services: `app` (Node backend), `frontend` (Next.js or static build served by app), `db` (PostgreSQL 18). Use env files for secrets; non-root user in Dockerfile; healthchecks for db and app. Separate compose profiles for local, test, prod (e.g. prod with restart policies, no mount for db data in prod or documented volume).
- **Rationale**: Constitution: Docker-first, separate DB, backup/restore supported. PostgreSQL in its own container; app connects via env DATABASE_URL.
- **Alternatives considered**: Single container with DB — rejected (separation of concerns). Kubernetes — out of scope for "home business"; compose sufficient.

---

## Observability

- **Decision**: Structured JSON logging (pino with Fastify); correlation ID per request; audit log as dedicated store (table or append-only) for order/payment/config actions (actor, timestamp, outcome). Metrics: expose Prometheus-compatible /metrics or use a small metrics library (e.g. prom-client); key counters: quote requests, orders created, payment success/failure, upload success/failure. Health endpoint: /health (and /ready if DB required).
- **Rationale**: Production-grade observability; constitution auditability; operations can debug and monitor without coupling to printer connector.
- **Alternatives considered**: OpenTelemetry — adopt later if needed; file-based audit only — DB table preferred for queryability and backup.

---

## Printer-Assignment Boundary (Future Connector)

- **Decision**: Define a single "printer job bundle" contract (JSON or similar): job id, files references, print options (material, quality, quantity, etc.), deadline, idempotency key. Backend service builds this payload from order/job data and stores it (e.g. in DB or queue table); no outbound call to any printer in this phase. Future Bambu Lab connector will consume from this store or a dedicated queue/API. API contract document in contracts/ for this payload shape.
- **Rationale**: FR-019, FR-023: well-defined payload, no direct printer telemetry or control; clear boundary for connector to integrate.
- **Alternatives considered**: Outbound HTTP to connector in phase 1 — rejected (connector not built). Message queue (RabbitMQ/SQS) — optional later; DB table or file-based handoff sufficient for phase 1.
