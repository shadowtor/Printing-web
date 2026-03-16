# Feature Specification: Playground.au Phase 1 — Storefront & Management

**Feature Branch**: `001-playground-phase1`  
**Created**: 2025-03-16  
**Status**: Draft  
**Input**: Build the first part of Playground.au, a production-grade 3D printing commerce platform for a home business. Frontend and management application only; no printer connector. Public storefront, configurable checkout, customer accounts, and internal management backend. Full lifecycle quote→fulfillment with approvals, revisions, reprints. Prepare for future Bambu Lab connector; no direct printer telemetry or control in this phase.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get an instant quote from the storefront (Priority: P1)

A visitor opens the public storefront, browses catalog items (or starts from “upload my file”), uploads one or more 3D model files (STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD, USDZ, USDA, USDC, or ZIP), configures print options (material, quality, tolerance class, quantity, turnaround profile), and receives an instant estimate with pricing breakdown, feasibility guidance, material recommendations, and lead time. No account is required for this flow.

**Why this priority**: Core value proposition—customers must be able to get a quote before committing. Everything else (cart, checkout, accounts, admin) builds on this.

**Independent Test**: Open storefront → upload a valid STL → set material/quality/quantity/turnaround → see estimate with price, feasibility, and lead time. Repeat with other supported formats (e.g. OBJ, 3MF, ZIP). Delivers value as a standalone “quote calculator” experience.

**Acceptance Scenarios**:

1. **Given** the public storefront is open, **When** the user selects a catalog item or “upload my file”, **Then** the user can upload at least one file in a supported format and see accepted formats listed.
2. **Given** one or more valid 3D files are uploaded, **When** the user selects material, quality, tolerance class, quantity, and turnaround profile, **Then** the system shows an instant estimate with line-item pricing, feasibility guidance, material recommendations, and lead time.
3. **Given** the user has an estimate, **When** they choose to continue, **Then** they can add the job to cart (see US2) or create an account (see US3) without losing the quote.
4. **Given** an unsupported or corrupted file is uploaded, **When** validation runs, **Then** the user sees a clear error and can replace or remove the file.

---

### User Story 2 - Add to cart and complete checkout (Priority: P2)

A customer (guest or logged-in) adds one or more quoted jobs to the cart, reviews the cart with pricing breakdown, and completes checkout. Payment methods are configurable by administrators: Stripe, PayPal, cash, invoice, purchase order, or quote-request workflow. The customer selects an available payment method and completes or initiates payment according to that method (e.g. redirect to Stripe, mark as “pay on invoice”, or submit as quote request).

**Why this priority**: Converts quotes into orders and revenue. Depends on P1 (quote) and enables P3 (order tracking).

**Independent Test**: Add a quoted job to cart → view cart → proceed to checkout → select an enabled payment method (e.g. Stripe or quote-request) → complete or submit the flow. Verify order appears in “my orders” for logged-in user or is retrievable by reference for guest. Delivers value as a minimal path to “order placed.”

**Acceptance Scenarios**:

1. **Given** the customer has one or more jobs in the cart, **When** they view the cart, **Then** they see a pricing breakdown and can adjust quantity or remove items before checkout.
2. **Given** the customer proceeds to checkout, **When** payment methods are configured by admins, **Then** only enabled methods (Stripe, PayPal, cash, invoice, PO, quote-request) are shown and selectable.
3. **Given** the customer selects Stripe or PayPal, **When** they confirm, **Then** they are redirected to the payment provider and, on success, the order is created and the customer sees confirmation.
4. **Given** the customer selects invoice, PO, or quote-request, **When** they submit, **Then** the order is created in a state reflecting that payment is pending (e.g. “pending approval” or “awaiting payment”) and the customer sees confirmation with next steps.
5. **Given** a guest completes checkout, **When** the order is created, **Then** they receive an order reference and (if provided) email for status tracking; optional account creation can be offered post-checkout.

---

### User Story 3 - Customer account: orders, approvals, revisions, progress (Priority: P3)

A logged-in customer can create an account (or use an existing one), view a list of their orders, and for each order: respond to approval requests, request revisions or reprints, view production progress timelines, and interact with project workspaces and pinned part comments. The system supports the full lifecycle from quote to fulfillment, including approval steps, revision/reprint workflows, and clear status visibility.

**Why this priority**: Retains customers and reduces support load by giving them self-service order and approval management. Builds on P1 and P2.

**Independent Test**: Register or log in → place an order (or use a seeded order) → open order detail → respond to an approval request (if any) → request a revision or reprint (if applicable) → view production progress and workspace/comments. Delivers value as “customer can manage their order without email.”

**Acceptance Scenarios**:

1. **Given** the customer is unauthenticated, **When** they choose to register, **Then** they can create an account with required identity/contact fields and then access “My orders” and account features.
2. **Given** the customer has orders, **When** they open “My orders”, **Then** they see a list with status and key details and can open any order for detail.
3. **Given** an order has an approval request, **When** the customer opens that order, **Then** they can view the request and respond (approve, reject, or comment), and the outcome is recorded and visible to fulfillment.
4. **Given** the customer is viewing an order, **When** policy allows revisions or reprints, **Then** they can submit a revision or reprint request with context, and it appears in the admin/fulfillment workflow.
5. **Given** an order is in production, **When** the customer views the order, **Then** they see a production progress timeline (stages and, where applicable, high-level status) and can access project workspace and pinned part comments.
6. **Given** the customer uses project workspaces or part comments, **When** they add or view pinned comments, **Then** those are associated with the correct job/part and visible to fulfillment and to the customer in context.

---

### User Story 4 - Admin and fulfillment: catalog, pricing, orders, queues, operations (Priority: P4)

Administrators and fulfillment staff use an internal management backend to: manage product templates and models; manage featured content; configure pricing profiles and quote rules; manage order lifecycle stages and production queues; prepare printer-assignment (e.g. job packaging for a future connector, without direct printer control); view analytics; and run backups, restores, and environment validation. Payment methods (Stripe, PayPal, cash, invoice, PO, quote-request) are configurable on or off. The system does not include direct printer telemetry or direct printer control; it prepares data for a future Bambu Lab connector service.

**Why this priority**: Required to operate the business and support P1–P3, but the storefront and checkout (P1–P2) deliver customer value first.

**Independent Test**: Log in as admin → create or edit a product template and pricing profile → create a quote rule → open an order and move it through lifecycle stages → assign the order (or its jobs) to a production queue and prepare “printer assignment” data (e.g. job bundle for future connector). Run backup/restore and environment validation from the admin UI or documented procedures. Delivers value as “business can configure and operate the platform.”

**Acceptance Scenarios**:

1. **Given** the admin is in the backend, **When** they manage product templates and models, **Then** they can create, update, and deactivate templates and link models so the storefront catalog and quote engine use them correctly.
2. **Given** the admin manages featured content, **When** they set items or banners as featured, **Then** the storefront reflects that for browsing and discovery.
3. **Given** the admin configures pricing and quoting, **When** they set pricing profiles and quote rules (e.g. by material, quality, turnaround), **Then** customer quotes use these rules and show correct pricing and feasibility.
4. **Given** the admin configures payment methods, **When** they enable or disable Stripe, PayPal, cash, invoice, PO, or quote-request, **Then** only enabled methods appear at checkout and existing orders retain their chosen method.
5. **Given** fulfillment staff view orders, **When** they change order or job status, **Then** lifecycle stages update, audit log records the change, and customers see updated progress where applicable.
6. **Given** fulfillment staff manage production queues, **When** they assign jobs to queues and prepare printer-assignment data, **Then** the system produces a well-defined payload (e.g. job bundle) suitable for a future printer connector, with no direct printer telemetry or control in this phase.
7. **Given** the admin runs analytics, **When** they view dashboards or reports, **Then** they see metrics relevant to orders, quotes, revenue, and fulfillment (as defined in FRs).
8. **Given** the admin runs backups or restores, **When** they follow documented procedures (or in-app actions), **Then** data and configuration backup/restore complete successfully and environment validation confirms required services and config.

---

### Edge Cases

- **Unsupported or malicious file uploads**: System validates file type (extension + MIME/signature where applicable), rejects unsupported formats and archives that exceed safe size or contain path traversal; errors are explicit and non-technical where shown to users.
- **Payment provider failure (Stripe/PayPal down or webhook delay)**: Orders are created in a “payment pending” or “verifying” state; user sees clear message; admin can reconcile or retry; no double-charge; audit log records attempts and outcomes.
- **Approval timeout or no response**: Configurable rules for when an approval request expires or escalates; customer and admin both see current state; order can move to “needs attention” or fallback path.
- **Concurrent edit (e.g. admin and customer both change same order)**: Optimistic locking or last-write-wins with clear visibility; critical actions (e.g. payment capture, status to “shipped”) are audited and idempotent where possible.
- **Guest checkout then same email registers**: System can link past guest orders to the new account when email matches (with optional confirmation) so “My orders” is complete.
- **Quote rules or pricing change mid-session**: Quote is fixed at “add to cart” or at checkout; existing cart/checkout uses snapshot of pricing/rules; new quotes use current rules.
- **Backup/restore during active traffic**: Procedure documents impact (e.g. read-only window or consistency guarantees); restore does not overwrite without explicit confirmation and audit.

---

## Requirements *(mandatory)*

Feature requirements align with the project constitution (`.specify/memory/constitution.md`): security (env-based secrets, safe file handling), testability, explicit error handling, auditability, and architecture boundaries for a future printer connector.

### Functional Requirements

**Storefront & quoting**

- **FR-001**: System MUST provide a public storefront where customers can browse catalog items without logging in.
- **FR-002**: System MUST accept customer uploads of 3D model files in at least: STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD, USDZ, USDA, USDC, and ZIP (with safe extraction and validation).
- **FR-003**: System MUST allow customers to configure print options: material, quality, tolerance class, quantity, and turnaround profile (options driven by admin-configured product/pricing data).
- **FR-004**: System MUST compute and display an instant estimate with: pricing breakdown, feasibility guidance, material recommendations, and lead time indication, using admin-configured pricing profiles and quote rules.
- **FR-005**: System MUST validate uploaded files (type, size, and safe path/content) and return explicit errors; file handling MUST NOT allow path traversal or execution of uploaded content.

**Cart & checkout**

- **FR-006**: System MUST allow adding one or more quoted jobs to a cart (guest or logged-in) and reviewing cart with pricing breakdown before checkout.
- **FR-007**: System MUST support configurable payment methods: Stripe, PayPal, cash, invoice, purchase order, and quote-request workflow; only admin-enabled methods MUST be available at checkout.
- **FR-008**: System MUST create an order when checkout completes (or when quote-request is submitted) and MUST record chosen payment method and payment state (e.g. pending, paid, failed).
- **FR-009**: System MUST support guest checkout with optional order reference and email for status; MUST allow linking guest orders to a newly created account when email matches (with optional confirmation).

**Customer accounts & lifecycle**

- **FR-010**: System MUST provide customer registration and authentication and a “My orders” view with order list and detail.
- **FR-011**: System MUST support approval requests on orders: customer can view and respond (approve/reject/comment); responses MUST be recorded and visible to fulfillment; behavior MUST be auditable.
- **FR-012**: System MUST support customer-initiated revision and reprint requests (when policy allows); requests MUST flow to fulfillment and be visible in order history and admin backend.
- **FR-013**: System MUST show production progress timelines to the customer (stages and status) and MUST support project workspaces and pinned part comments tied to jobs/parts, visible to customer and fulfillment.

**Admin & fulfillment**

- **FR-014**: System MUST provide an internal management backend (admin/fulfillment) with access control; actions affecting orders, pricing, or configuration MUST be auditable (actor, timestamp, outcome).
- **FR-015**: Admins MUST be able to manage product templates, models, and featured content used by the storefront and quote engine.
- **FR-016**: Admins MUST be able to configure pricing profiles and quote rules that drive instant estimates (material, quality, turnaround, feasibility, lead time).
- **FR-017**: Admins MUST be able to enable or disable each payment method (Stripe, PayPal, cash, invoice, PO, quote-request); configuration MUST be stored and applied at checkout.
- **FR-018**: Fulfillment staff MUST be able to manage order lifecycle stages and production queues; status changes MUST be recorded and reflected in customer-facing progress where applicable.
- **FR-019**: System MUST support “printer assignment preparation”: producing a well-defined job/payload (e.g. for a future Bambu Lab connector) without direct printer telemetry or direct printer control in this phase.
- **FR-020**: Admins MUST be able to view analytics (e.g. orders, quotes, revenue, fulfillment metrics) and MUST have documented backup and restore procedures; system MUST support environment validation (e.g. required services and configuration checks).

**Security, errors, and architecture**

- **FR-021**: Secrets (API keys, DB URLs, payment keys) MUST be supplied via environment or secure secret store; MUST NOT be stored in version-controlled config.
- **FR-022**: Errors (validation, payment, upload, workflow) MUST be handled explicitly and surfaced with clear, safe messages to users; critical failures MUST be logged with context for operators.
- **FR-023**: Architecture MUST expose a clear boundary (e.g. API or service contract) for “printer assignment” / job handoff so a future Bambu Lab connector can integrate without coupling to UI or core commerce logic; this phase MUST NOT implement direct printer telemetry or direct printer control.

### Key Entities

- **CatalogItem**: Sellable product or “upload my file” template; links to product template and optional default options; used for storefront browsing and quote entry.
- **ProductTemplate / Model**: Admin-defined template and linked 3D models; drives available materials, qualities, and pricing; used by quote engine.
- **Job**: A single quoted unit (one or more files + print options); belongs to a quote/cart and then to an order line.
- **Quote**: Snapshot of one or more jobs with pricing, feasibility, and lead time; can be “current” (in progress) or “locked” when added to cart.
- **Cart**: Session or user-scoped container of quoted jobs (guest or logged-in); has a pricing summary and is the input to checkout.
- **Order**: Post-checkout record; has lines (jobs), chosen payment method, payment state, lifecycle stage, customer (or guest reference), and audit trail.
- **Customer**: Registered user; identity/contact; owns orders and account features (approvals, revisions, workspaces, comments).
- **PricingProfile / QuoteRule**: Admin-configured rules that map materials, quality, turnaround, etc., to prices, feasibility, and lead time; used by quote engine.
- **PaymentMethodConfig**: Admin toggle per method (Stripe, PayPal, cash, invoice, PO, quote-request); stored and read at checkout.
- **OrderLifecycleStage**: Status and stage of an order (e.g. quote, approved, in production, shipped); transitions auditable.
- **ProductionQueue**: Fulfillment-side queue of jobs/orders; supports assignment and “printer assignment” payload for future connector.
- **ApprovalRequest / RevisionRequest / ReprintRequest**: Customer-facing workflow artifacts tied to an order/job; stored and visible to fulfillment and customer.
- **ProjectWorkspace / PinnedPartComment**: Customer and fulfillment collaboration tied to job/part; persisted and visible in context.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can upload a supported 3D file, set print options, and see an instant estimate (price, feasibility, lead time) in under two minutes without creating an account.
- **SC-002**: A customer can add a quoted job to the cart and complete checkout with at least one enabled payment method (e.g. Stripe or quote-request); order is created and visible (to customer or by reference) with correct payment state.
- **SC-003**: A logged-in customer can open “My orders,” open an order, respond to an approval request, and (where allowed) submit a revision or reprint request; fulfillment sees the update in the backend.
- **SC-004**: An admin can enable/disable payment methods, and the next checkout only shows enabled methods; an admin can run a backup (or follow documented backup procedure) and environment validation successfully.
- **SC-005**: Order and payment state changes are recorded with actor and timestamp; file uploads are validated (type/size/path safety) with explicit errors; no secrets in version-controlled config.
- **SC-006**: System produces a well-defined “printer assignment” payload (e.g. job bundle) suitable for a future connector; no direct printer telemetry or control is implemented in this phase.
