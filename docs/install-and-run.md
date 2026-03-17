# Install and run

How to install and run the Printing-web platform locally.

## Prerequisites

- **Node.js 24 LTS** and npm
- **PostgreSQL** (or Docker to run it in a container)
- Optional: **Docker** and **Docker Compose** to run the full stack (database, backend, frontend)

## Environment variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/printing`) |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | HTTP port (default `3000`) |
| `ADMIN_SECRET` | No | Secret for admin API; use as `Authorization: Bearer admin:<ADMIN_SECRET>` |
| `STRIPE_SECRET_KEY` | No | Stripe API key (when Stripe payment method is enabled) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | No | PayPal client ID (when PayPal is enabled) |
| `PAYPAL_CLIENT_SECRET` | No | PayPal client secret |
| `CONNECTOR_API_URL` | No | Base URL for the external connector service (used by admin dispatch endpoint) |
| `CONNECTOR_API_KEY` | No | Bearer token used by backend when calling connector APIs |
| `CONNECTOR_WEBHOOK_SECRET` | No | Shared secret for inbound connector webhooks (`Authorization: Bearer <secret>`) |
| `REDIS_URL` | No | Redis URL for cache and rate limiting (e.g. `redis://localhost:6379`). If unset, backend runs without cache and without rate limiting. |
| `UPLOAD_DIR` | No | Directory for uploaded files (defaults to app default) |
| `MAX_UPLOAD_BYTES` | No | Max upload size in bytes |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE` | No | Backend API base URL (default `http://localhost:3000/api/v1` when backend runs on 3000) |

Copy `.env.example` from the repo root to `.env` and set `DATABASE_URL` and `NODE_ENV`; add `ADMIN_SECRET` to use the admin API/UI. See the [spec quickstart](../specs/001-playground-phase1/quickstart.md) for a minimal setup.

## Option A — Docker Compose

From the repository root:

1. Start the database and wait for it to be ready:
   ```bash
   docker-compose up -d db
   ```
   Wait for PostgreSQL to pass its healthcheck (or a few seconds).

2. Run migrations (see [Migrations](#migrations) below). You can run them from your host if `DATABASE_URL` points at the DB (e.g. `postgresql://printing:printing@localhost:5432/printing`), or by exec’ing into the backend container after it’s up.

3. Start the backend (and optionally the frontend):
   ```bash
   docker-compose up -d backend
   docker-compose up -d frontend   # optional
   ```

Compose files:

- **Local testing** (default): [docker-compose.yml](../docker-compose.yml) or [docker-compose.local.yml](../docker-compose.local.yml) — development settings, `NODE_ENV=development`, all ports exposed. Use: `docker compose up -d` (or `docker compose -f docker-compose.local.yml up -d`).
- **Production**: [docker-compose.prod.yml](../docker-compose.prod.yml) — `NODE_ENV=production`, `restart: always`. Set `ADMIN_SECRET`, `POSTGRES_PASSWORD`, and other secrets via env file or environment. Use: `docker compose -f docker-compose.prod.yml up -d`.

With the default compose (local):

- **db**: PostgreSQL 18 on port 5432, database `printing`, user `printing`.
- **redis**: Redis 7 on port 6379 (optional; backend uses it for cache/rate limit when `REDIS_URL` is set).
- **backend**: Built from `./backend`, port **3000**, env from Compose (e.g. `DATABASE_URL=postgres://printing:printing@db:5432/printing`).
- **frontend**: Built from `./frontend`, port **3001** (mapped from container 3000).

So with Docker: backend at `http://localhost:3000`, frontend at `http://localhost:3001`. The frontend container’s default `NEXT_PUBLIC_API_BASE` may point at the backend; if you need to call the host, set it to `http://localhost:3000/api/v1` (or your backend URL) in the frontend environment.

## Option B — Local run (no Docker for app)

1. **Start PostgreSQL**  
   For example: `docker-compose up -d db` (only the db service), or use a local PostgreSQL instance. Ensure `DATABASE_URL` in your backend env matches (e.g. `postgresql://printing:printing@localhost:5432/printing`).

2. **Backend**
   ```bash
   cd backend
   npm ci
   npx prisma generate
   npx prisma migrate deploy   # or npx prisma migrate dev for development
   npm run build
   npm run dev
   ```
   Backend runs by default on **port 3000**. The dev script runs the built output from `dist/`.

3. **Frontend** (separate terminal)
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```
   Next.js default port is 3000; if the backend is already on 3000, the frontend will use another port (e.g. 3001) or you can set `PORT=3001` for the frontend. Set `NEXT_PUBLIC_API_BASE` to your backend API base (e.g. `http://localhost:3000/api/v1`) if the frontend runs on a different host/port.

## Migrations

From the backend directory:

- **Apply existing migrations (e.g. production or CI):**
  ```bash
  npx prisma migrate deploy
  ```
- **Development (create new migrations and apply):**
  ```bash
  npx prisma migrate dev
  ```

Ensure `DATABASE_URL` is set and correct before running migrations.

## Quick checks

- **Storefront:** Open the frontend URL → browse catalog or “upload my file” → upload a small file → set options → get quote. Add to cart → checkout (e.g. with `quote_request` if no payment provider is configured).
- **Admin:** Use `Authorization: Bearer admin:<ADMIN_SECRET>` (with `ADMIN_SECRET` set) to call admin endpoints (e.g. `GET /api/v1/admin/ops/env`).

Tests (no live payment providers; use test DB or mocks as needed):

```bash
cd backend && npm test    # requires DATABASE_URL
cd frontend && npm run lint && npm run typecheck
```

---

## Backup and restore

- **Backup:** Use `pg_dump` against the PostgreSQL instance (e.g. from the `db` container or your host). Example from host: `docker-compose exec db pg_dump -U printing printing > backup.sql`. If uploads are stored on disk, back up that directory separately.
- **Restore:** Restore only with explicit confirmation and in a maintenance window. Example: `docker-compose exec -T db psql -U printing printing < backup.sql`. See [database.md](database.md) for schema context.
- **Admin backup stub:** The admin API exposes `POST /api/v1/admin/ops/backup` as a stub; it does not perform a real backup. Use the procedures above for actual backups.

---

## Connector boundary

The application does not control printers directly. Admin “prepare” creates a **PrinterAssignmentPayload** (JSON) per order line and stores it.

When connector integration variables are configured:

- `POST /api/v1/admin/orders/:orderId/lines/:orderLineId/dispatch` (admin-only) submits the latest prepared payload to the external connector service.
- `POST /api/v1/webhooks/connector` accepts connector events using service-to-service auth with `CONNECTOR_WEBHOOK_SECRET`.

Storefront/customer APIs remain unchanged. Admin and connector integration stay backend-only and authenticated.
