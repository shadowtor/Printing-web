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
# Wait for PostgreSQL to be ready
docker-compose up -d backend
# Optional: run frontend in container
docker-compose up -d frontend
```

The repo `docker-compose.yml` provides:

- **db**: image `postgres:18`, port 5432, volume for data, env POSTGRES_USER/PASSWORD/DB.
- **backend**: build `./backend`, env DATABASE_URL (and optional .env), depends_on db, port 3000.
- **frontend**: build `./frontend`, depends_on backend, port 3001 (maps to container 3000).

---

## 4. Database migrations

With backend container or local Node (DATABASE_URL set):

```bash
cd backend && npx prisma migrate deploy
# Or for dev with new migrations: npx prisma migrate dev
```

---

## 5. Run the app (without Docker, optional)

If running backend and frontend locally (e.g. for development):

```bash
# Terminal 1: PostgreSQL
docker-compose up -d db

# Terminal 2: Backend (build then watch)
cd backend && npm ci && npm run build && npm run dev

# Terminal 3: Frontend
cd frontend && npm ci && npm run dev
```

Backend at `http://localhost:3000` (health: `GET /health`). Frontend at `http://localhost:3000` when run alone (Next.js default) or use `npm run dev -- -p 3001` to avoid port clash. API base path `/api/v1` (public) and `/api/v1/admin` (admin).

---

## 6. Smoke test

- **Storefront**: Open storefront URL → browse catalog or “upload my file” → upload a small STL → set options → get quote. No login required.
- **Checkout**: Add to cart → checkout → choose an enabled payment method (e.g. quote_request for no payment provider) → submit → see order number and confirmation.
- **Admin**: Open `/admin`, sign in with admin secret (value of `ADMIN_SECRET`). Then: view dashboard/analytics, run environment validation (`GET /api/v1/admin/ops/env`), or trigger backup stub (`POST /api/v1/admin/ops/backup`). Backend health: `GET http://localhost:3000/health`.

---

## 7. Tests

```bash
cd backend && npm test          # Vitest: unit + integration (requires DATABASE_URL)
cd frontend && npm run typecheck && npm run build   # typecheck and build; E2E in tests/e2e (T074)
```

Backend integration tests require `DATABASE_URL`. Use a test database or CI-provided URL. Frontend E2E (Playwright) is added in task T074 and wired in CI.

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
