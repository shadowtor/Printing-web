# Implementation Plan: Playground.au Phase 1 — Storefront & Management

**Branch**: `001-playground-phase1` | **Date**: 2025-03-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-playground-phase1/spec.md`

**Note**: This plan is produced by the `/speckit.plan` command. Technical context and stack follow user direction: Node.js 24 LTS, PostgreSQL 18, TypeScript full-stack, Docker-first, Stripe/PayPal optional, secure file upload, explicit API contracts, auditability, backups/restores, observability.

## Summary

Build the first part of Playground.au: a production-grade 3D printing commerce platform (frontend + management app only). Public storefront with catalog and file upload (STL, OBJ, 3MF, etc.), instant quoting with pricing/feasibility/lead time; cart and checkout with configurable payment methods (Stripe, PayPal, cash, invoice, PO, quote-request); customer accounts (orders, approvals, revisions, reprints, progress, workspaces); and an internal admin/fulfillment backend (catalog, pricing, orders, queues, printer-assignment preparation, analytics, backup/restore, env validation). Full lifecycle quote→fulfillment with no direct printer telemetry or control; clear boundary for a future Bambu Lab connector.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24 LTS (runtime)  
**Primary Dependencies**: Backend: Node 24, Fastify or Express (TBD in research), Prisma or Drizzle (ORM), Zod (validation). Frontend: React or Next.js (TBD), strict TypeScript. Payments: Stripe SDK, PayPal SDK (optional when enabled).  
**Storage**: PostgreSQL 18; file store for uploads (local or S3-compatible, path-safe, no execution).  
**Testing**: Vitest or Jest (unit/integration), Playwright or Cypress (e2e), contract tests for public API.  
**Target Platform**: Docker (local, test, prod); Linux containers; separate app + DB containers.  
**Project Type**: Full-stack web application (storefront SPA or SSR + management SPA, API backend).  
**Performance Goals**: Instant quote response (<2s), checkout flow <1 min; support home-business scale (hundreds of orders, thousands of files).  
**Constraints**: Secure file upload (type/size/path validation, no path traversal); env-based secrets only; audit log for order/payment/config changes; backup/restore documented and supported.  
**Scale/Scope**: Single deployment; admin + fulfillment users; public customers; future connector consumes printer-assignment payload only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality & Type Safety**: Satisfied — TypeScript strict mode; latest stable deps within support window; lint and type-check gates before merge.
- **Security**: Satisfied — Secrets via env/secret store; file handling with validation, path constraints, safe MIME/type checks; no credentials in repo.
- **Testability & Error Handling**: Satisfied — Testable in isolation; external I/O abstracted; explicit errors with context; no silent swallows.
- **Docker-First Deployment**: Satisfied — App and PostgreSQL in Docker for non-local; Dockerfile(s) at repo root or documented path; non-root where possible; backup/restore documented and supported.
- **Operational Auditability & UX**: Satisfied — Order/quote/payment actions auditable (actor, timestamp, outcome); clear status and confirmation for irreversible actions.
- **Architecture Boundaries**: Satisfied — Printer-assignment/job handoff behind defined interface (API or service contract); no direct printer telemetry or control in this phase; future Bambu Lab connector integrates via this boundary.
- **Documentation**: Satisfied — Public and internal APIs documented; deployment, config, backup/restore documented; README states purpose and how to run/test.
- **Non-commercial notice**: Satisfied — Project docs (README/LICENSE/notice) include non-commercial use notice per project policy.

No constitution violations. Complexity Tracking table left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-playground-phase1/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (API and printer-assignment)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
# Monorepo or single repo: backend API + frontend apps
backend/
├── src/
│   ├── config/          # Env, validation
│   ├── db/              # Migrations, client (Prisma/Drizzle)
│   ├── models/          # Domain entities (re-exports or thin layer)
│   ├── services/        # Quote, cart, order, payment, upload, audit
│   ├── api/              # REST routes, auth middleware
│   └── jobs/             # Printer-assignment payload builder (boundary for connector)
├── tests/
│   ├── contract/
│   ├── integration/
│   └── unit/
└── Dockerfile

frontend/
├── src/
│   ├── app/             # Storefront app (pages, layout)
│   ├── admin/           # Management app (or separate app)
│   ├── components/
│   ├── services/        # API client
│   └── lib/
├── tests/
└── Dockerfile

# Shared types/contracts (optional package)
packages/
└── types/               # Shared DTOs, API contract types (optional)

docker-compose.yml       # app + postgres; local/test/prod profiles
```

**Structure Decision**: Backend (Node/TypeScript API) and frontend (React/Next or similar) in separate directories; shared contracts in repo or packages/types. Database in separate container. Printer-assignment boundary implemented as a dedicated service/module (`backend/src/jobs` or similar) producing a well-defined payload; no printer SDK or telemetry in this repo.

## Complexity Tracking

> No constitution violations. Table left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
