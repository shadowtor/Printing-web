# Quickstart: Playground.au Phase 1

**Feature**: 001-playground-phase1  
**Stack**: Node.js 24 LTS, PostgreSQL 18, TypeScript (Fastify + Next.js), Docker.

This quickstart gets the app and database running locally via Docker. Secrets and production deployment are documented in the main repo README and ops docs.

---

## Prerequisites

- Docker and Docker Compose (or compatible)
- Git
- (Optional) Node 24 LTS locally for running tests without Docker

---

## 1. Clone and branch

```bash
git clone <repo-url> && cd Printing-web
git checkout 001-playground-phase1
```

---

## 2. Environment

Copy env example and set required variables (no secrets in repo):

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, optional STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID/SECRET, etc.
# For local dev, DATABASE_URL is typically set by docker-compose (see below).
```

Required for app (see constitution — env-based secrets only):

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@db:5432/playground`)
- `NODE_ENV` — development | test | production
- Optional: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (only when payment methods are enabled)

---

## 3. Docker Compose (local)

From repo root:

```bash
docker-compose up -d db
# Wait for PostgreSQL 18 to be ready (healthcheck)
docker-compose up -d app
# Optional: frontend in separate container or served by app
# docker-compose up -d frontend
```

Example `docker-compose.yml` (structure only; actual file in repo):

- **db**: image `postgres:18`, port 5432, volume for data, healthcheck, env POSTGRES_USER/PASSWORD/DB.
- **app**: build `./backend` (Dockerfile), env from `.env`, depends_on db, port 3000 (or as configured). Run as non-root user.
- Optional **frontend**: build `./frontend` or proxy via app.

---

## 4. Database migrations

With app container or local Node:

```bash
# Inside app container or with DATABASE_URL set locally
cd backend && npx prisma migrate deploy
# Or for dev: npx prisma migrate dev
```

---

## 5. Run the app (without Docker, optional)

If running backend and frontend locally (e.g. for tests):

```bash
# Terminal 1: PostgreSQL (Docker or local)
docker-compose up -d db

# Terminal 2: Backend
cd backend && npm ci && npm run dev

# Terminal 3: Frontend
cd frontend && npm ci && npm run dev
```

Backend typically at `http://localhost:3000`; frontend at `http://localhost:3001` (or as configured). API base path `/api/v1` (public) and `/api/v1/admin` (admin).

---

## 6. Smoke test

- **Storefront**: Open storefront URL → browse catalog or “upload my file” → upload a small STL → set options → get quote. No login required.
- **Checkout**: Add to cart → checkout → choose an enabled payment method (e.g. quote_request for no payment provider) → submit → see order number and confirmation.
- **Admin**: Log in as admin → enable/disable a payment method → run environment validation (e.g. GET /api/v1/admin/health or POST /api/v1/admin/ops/validate-environment).

---

## 7. Tests

```bash
cd backend && npm test          # unit + integration
cd frontend && npm test         # unit + e2e (Playwright/Cypress)
# Contract tests: npm run test:contract (if implemented)
```

Tests must run without live payment providers (mocked); use test DB or in-memory where applicable (constitution: testability).

---

## 8. Backup and restore

- **Backup**: Documented procedure (e.g. `pg_dump` from db container, plus file storage backup if uploads stored on disk). See main docs.
- **Restore**: Documented procedure; restore only with explicit confirmation and audit. See main docs and FR-020.

---

## References

- **Spec**: [spec.md](./spec.md)  
- **Plan**: [plan.md](./plan.md)  
- **Data model**: [data-model.md](./data-model.md)  
- **Contracts**: [contracts/](./contracts/)  
- **Constitution**: `.specify/memory/constitution.md`
