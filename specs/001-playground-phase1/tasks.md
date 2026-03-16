# Tasks: Playground.au Phase 1 — Storefront & Management

**Input**: Design documents from `/specs/001-playground-phase1/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are recommended for core flows (quote, checkout, account, admin), but individual test tasks are called out only where high risk or contract coverage is important.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend project structure in `backend/src/` per implementation plan
- [x] T002 Create frontend project structure in `frontend/src/` per implementation plan
- [x] T003 Initialize Node.js 24 + TypeScript configs in `backend/package.json` and `backend/tsconfig.json`
- [x] T004 Initialize Next.js + TypeScript frontend in `frontend/package.json` and `frontend/tsconfig.json`
- [x] T005 [P] Configure linting and formatting (ESLint, Prettier) for backend in `backend/eslint.config.mjs`
- [x] T006 [P] Configure linting and formatting (ESLint, Prettier) for frontend in `frontend/eslint.config.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Setup Prisma with PostgreSQL 18 in `backend/prisma/schema.prisma` and `backend/src/db/client.ts`
- [x] T008 Create initial database migrations for core entities (Customer, CatalogItem, ProductTemplate, Quote, Cart, Order, OrderLine) in `backend/prisma/migrations/`
- [x] T009 [P] Implement configuration loading and validation (env-based secrets only) in `backend/src/config/index.ts`
- [x] T010 [P] Setup Fastify (or chosen framework) server with base `/api/v1` and `/api/v1/admin` routers in `backend/src/api/server.ts`
- [x] T011 [P] Implement global error handling and logging middleware in `backend/src/api/middleware/error-handler.ts`
- [x] T012 [P] Implement authentication/session framework (customer + admin roles) in `backend/src/api/middleware/auth.ts`
- [x] T013 Setup Docker and docker-compose services for `app` and `db` in `docker-compose.yml` and backend/frontend `Dockerfile`s
- [x] T014 Configure basic audit event model and persistence in `backend/src/models/audit-event.ts`
- [x] T015 Setup environment validation and healthcheck endpoints in `backend/src/api/routes/health.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Get an instant quote from the storefront (Priority: P1) 🎯 MVP

**Goal**: Public storefront visitor can upload 3D model files, configure print options, and receive an instant estimate with pricing, feasibility, material recommendations, and lead time without creating an account.

**Independent Test**: Open storefront → upload supported file(s) → select material/quality/tolerance/quantity/turnaround → see instant estimate with breakdown, feasibility, recommendations, and lead time; add to cart or continue to account without losing quote.

### Implementation for User Story 1

- [x] T016 [P] [US1] Implement CatalogItem model and repository in `backend/src/models/catalog-item.ts`
- [x] T017 [P] [US1] Implement ProductTemplate and Model repositories in `backend/src/models/product-template.ts`
- [x] T018 [P] [US1] Implement PricingProfile and QuoteRule repositories in `backend/src/models/pricing.ts`
- [x] T019 [P] [US1] Implement Quote and Job domain models in `backend/src/models/quote.ts`
- [x] T020 [US1] Implement quote calculation service (pricing + feasibility + lead time) in `backend/src/services/quote-service.ts`
- [x] T021 [US1] Implement secure upload service (validation, storage, path safety) in `backend/src/services/upload-service.ts`
- [x] T022 [US1] Implement public API routes for catalog in `backend/src/api/routes/catalog.ts` (GET `/catalog/items`, GET `/catalog/items/:slug`)
- [x] T023 [US1] Implement public API routes for upload & quote in `backend/src/api/routes/quote.ts` (POST `/upload`, POST `/quote/estimate`, POST `/quote/lock`)
- [ ] T024 [US1] Add integration tests for upload and quote endpoints in `backend/tests/integration/quote.test.ts`
- [ ] T025 [P] [US1] Implement storefront catalog and upload UI in `frontend/src/app/(storefront)/page.tsx`
- [ ] T026 [P] [US1] Implement quote configuration and results UI (options, breakdown, feasibility, recommendations) in `frontend/src/app/(storefront)/quote/page.tsx`
- [ ] T027 [US1] Implement frontend API client for upload and quote in `frontend/src/services/api/quote-client.ts`
- [ ] T028 [US1] Wire \"add to cart\" or \"continue\" actions from quote UI (without implementing cart/checkout yet) in `frontend/src/app/(storefront)/quote/page.tsx`

**Checkpoint**: User Story 1 functional and independently testable

---

## Phase 4: User Story 2 - Add to cart and complete checkout (Priority: P2)

**Goal**: Customer (guest or logged-in) can add quoted jobs to cart, review pricing, and complete checkout using admin-configured payment methods (Stripe, PayPal, cash, invoice, PO, quote-request).

**Independent Test**: With quoting working, add a job to cart → review cart → proceed to checkout → select an enabled payment method → complete or submit; order is created and visible (or retrievable by reference for guest) with correct payment state.

### Implementation for User Story 2

- [ ] T029 [P] [US2] Implement Cart and CartLine models and repositories in `backend/src/models/cart.ts`
- [ ] T030 [US2] Implement cart service (add/update/remove lines, totals) in `backend/src/services/cart-service.ts`
- [ ] T031 [US2] Implement PaymentMethodConfig model and repository in `backend/src/models/payment-method-config.ts`
- [ ] T032 [US2] Implement checkout service (order creation, payment state handling) in `backend/src/services/checkout-service.ts`
- [ ] T033 [US2] Implement public API routes for cart (GET `/cart`, POST `/cart/lines`, PATCH `/cart/lines/:lineId`) in `backend/src/api/routes/cart.ts`
- [ ] T034 [US2] Implement public API routes for checkout and payment methods (GET `/checkout/payment-methods`, POST `/checkout`) in `backend/src/api/routes/checkout.ts`
- [ ] T035 [US2] Implement Stripe and PayPal integration adapters in `backend/src/services/payments/stripe-adapter.ts` and `backend/src/services/payments/paypal-adapter.ts`
- [ ] T036 [US2] Implement payment webhooks (POST `/webhooks/stripe`, `/webhooks/paypal`) in `backend/src/api/routes/webhooks.ts` with idempotent reconciliation
- [ ] T037 [US2] Add integration tests for cart and checkout flows in `backend/tests/integration/checkout.test.ts`
- [ ] T038 [P] [US2] Implement frontend cart UI (view/edit cart with pricing breakdown) in `frontend/src/app/(storefront)/cart/page.tsx`
- [ ] T039 [P] [US2] Implement checkout UI with selectable payment methods in `frontend/src/app/(storefront)/checkout/page.tsx`
- [ ] T040 [US2] Implement frontend API client for cart and checkout in `frontend/src/services/api/checkout-client.ts`
- [ ] T041 [US2] Implement guest checkout reference + email capture and confirmation screens in `frontend/src/app/(storefront)/checkout/confirmation/page.tsx`

**Checkpoint**: User Stories 1 and 2 both functional and independently testable

---

## Phase 5: User Story 3 - Customer account: orders, approvals, revisions, progress (Priority: P3)

**Goal**: Logged-in customer can register, view orders, respond to approvals, request revisions or reprints, and view production progress timelines and workspace/comments.

**Independent Test**: Register/login → place order (or use seeded order) → open \"My orders\" → open order detail → respond to approval request, submit revision or reprint, and view production progress and workspace/comments.

### Implementation for User Story 3

- [ ] T042 [P] [US3] Implement Customer model and auth service (register/login) in `backend/src/services/auth-service.ts`
- [ ] T043 [US3] Implement customer orders API (GET `/orders`, GET `/orders/:id`) in `backend/src/api/routes/customer-orders.ts`
- [ ] T044 [US3] Implement approval, revision, and reprint request models and services in `backend/src/services/order-requests-service.ts`
- [ ] T045 [US3] Implement approval and request APIs (GET `/orders/:orderId/approval-request`, POST `/orders/:orderId/approval-request/respond`, POST `/orders/:orderId/revision-request`, POST `/orders/:orderId/reprint-request`) in `backend/src/api/routes/order-requests.ts`
- [ ] T046 [US3] Implement project workspace and pinned part comments models/services in `backend/src/services/workspace-service.ts`
- [ ] T047 [US3] Implement workspace and comments API (GET `/orders/:orderId/workspace`, POST `/orders/:orderId/workspace/comments`) in `backend/src/api/routes/workspace.ts`
- [ ] T048 [US3] Add production progress timeline computation (from OrderLifecycleStage + queue data) in `backend/src/services/order-timeline-service.ts`
- [ ] T049 [US3] Implement customer registration/login UI in `frontend/src/app/(auth)/` pages
- [ ] T050 [US3] Implement \"My orders\" list and detail views in `frontend/src/app/(account)/orders/` pages
- [ ] T051 [US3] Implement frontend UI for approvals, revisions, reprints, and workspace/comments in `frontend/src/app/(account)/orders/[orderId]/` components
- [ ] T052 [US3] Implement linking guest orders to account by email (API + UI) in `backend/src/api/routes/guest-link.ts` and `frontend/src/app/(account)/orders/link/page.tsx`

**Checkpoint**: User Stories 1–3 functional and independently testable

---

## Phase 6: User Story 4 - Admin and fulfillment: catalog, pricing, orders, queues, operations (Priority: P4)

**Goal**: Admin and fulfillment staff can manage catalog, pricing, payment configurations, order lifecycle, production queues, analytics, and backup/env validation; prepare printer-assignment payloads without direct printer control.

**Independent Test**: Admin logs in → configures catalog and pricing → toggles payment methods → views and updates orders and queues → runs analytics and env validation → prepares printer-assignment payloads (stored only).

### Implementation for User Story 4

- [ ] T053 [P] [US4] Implement admin auth/role checks middleware in `backend/src/api/middleware/admin-auth.ts`
- [ ] T054 [US4] Implement admin catalog and product template APIs in `backend/src/api/routes/admin/catalog.ts`
- [ ] T055 [US4] Implement admin pricing profile and quote rule APIs in `backend/src/api/routes/admin/pricing.ts`
- [ ] T056 [US4] Implement admin payment method config APIs in `backend/src/api/routes/admin/payment-methods.ts`
- [ ] T057 [US4] Implement admin orders and lifecycle APIs in `backend/src/api/routes/admin/orders.ts`
- [ ] T058 [US4] Implement ProductionQueue and PrinterAssignmentPayload services in `backend/src/services/queue-service.ts` and `backend/src/services/printer-assignment-service.ts`
- [ ] T059 [US4] Implement admin queue and printer-assignment APIs in `backend/src/api/routes/admin/queues.ts`
- [ ] T060 [US4] Implement admin analytics API in `backend/src/api/routes/admin/analytics.ts`
- [ ] T061 [US4] Implement admin backup/restore triggering and environment validation APIs in `backend/src/api/routes/admin/ops.ts`
- [ ] T062 [US4] Implement admin UI shell and navigation in `frontend/src/app/admin/layout.tsx`
- [ ] T063 [P] [US4] Implement admin catalog and pricing management screens in `frontend/src/app/admin/catalog/` and `frontend/src/app/admin/pricing/`
- [ ] T064 [P] [US4] Implement admin orders and lifecycle management screens in `frontend/src/app/admin/orders/`
- [ ] T065 [P] [US4] Implement admin queues and printer-assignment screens in `frontend/src/app/admin/queues/`
- [ ] T066 [US4] Implement admin analytics and ops screens (backup, env validation) in `frontend/src/app/admin/analytics/` and `frontend/src/app/admin/ops/`

**Checkpoint**: All four user stories functional and independently testable

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T067 [P] Documentation updates in `docs/` and `README.md` for setup, backup/restore, connector boundary, and non-commercial use notice
- [ ] T068 Code cleanup and refactoring across `backend/src/` and `frontend/src/`
- [ ] T069 Performance optimization for quote calculation (p95 < 2s) and checkout UX (typical flow < 1 minute), including profiling and fixes
- [ ] T070 [P] Additional unit tests for core services in `backend/tests/unit/`
- [ ] T071 [P] Security hardening (headers, rate limiting, auth hardening) in `backend/src/api/server.ts` and middleware
- [ ] T072 Run quickstart.md validation end-to-end to ensure steps remain accurate
- [ ] T073 [P] Configure CI pipeline (e.g. GitHub Actions) to run lint, typecheck, and tests on every PR and require passing checks before merge
- [ ] T074 [P] Add browser E2E tests with Playwright (or Browserless) in `tests/e2e/` that exercise storefront, quote, cart, checkout, and admin flows; wire into CI so new features are covered by E2E as they are added

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion  
  - User stories can then proceed in parallel (if staffed)  
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 quote outputs (quote lock) but is independently testable for cart/checkout
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 orders being created; independently testable for account flows
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Depends on basic entities (orders, queues) but not on storefront UX

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation when added
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within each story, [P] tasks (models, UI components, some services) can proceed in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE**: Test User Story 1 independently  
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready  
2. Add User Story 1 → Test independently → Deploy/Demo (MVP)  
3. Add User Story 2 → Test independently → Deploy/Demo  
4. Add User Story 3 → Test independently → Deploy/Demo  
5. Add User Story 4 → Test independently → Deploy/Demo  

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together  
2. Once Foundational is done:  
   - Developer A: User Story 1  
   - Developer B: User Story 2  
   - Developer C: User Story 3 or 4  
3. Stories complete and integrate independently

---

## Notes

- Tasks MUST support constitution principles: testability, explicit error handling, auditability, Docker-first deployment, and documentation (see `.specify/memory/constitution.md`).
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

