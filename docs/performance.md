# Performance

Targets and notes for Phase 1.

## Targets

- **Quote calculation:** p95 under 2 seconds. The quote service resolves pricing rules in one or few DB calls; if profiles or rules grow large, add indexes or caching (see schema and `findMatchingQuoteRules`).
- **Checkout UX:** Typical flow (cart → payment choice → submit) under 1 minute; backend order creation is a single transaction.

## Profiling

- Backend: Use Node built-in profiler or Fastify logger to identify slow handlers.
- Frontend: Use browser DevTools (Network, Performance) to measure API latency and render time.
- Database: Use Prisma query logging or PostgreSQL `log_min_duration_statement` to find slow queries.

## Hardening

- Add database indexes for filters used in list endpoints (e.g. order by `createdAt`, filter by `lifecycleStage`).
- Consider response caching for catalog and pricing profiles if they change rarely.
- Rate limiting (T071) helps protect against abuse that could degrade performance.
