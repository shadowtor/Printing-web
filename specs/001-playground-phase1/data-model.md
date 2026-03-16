# Data Model: Playground.au Phase 1

**Feature**: 001-playground-phase1  
**Date**: 2025-03-16

Entities, relationships, validation rules, and state transitions derived from the feature spec and FRs. Implement with Prisma (PostgreSQL 18); types and constraints below are specification-level.

---

## Entities

### Customer

- **Purpose**: Registered user; identity and contact; owns orders and account features.
- **Fields**: id (UUID), email (unique), password_hash, name, created_at, updated_at. Optional: phone, preferred_contact.
- **Validation**: Email format; password policy (min length, complexity per project policy).
- **Relations**: One-to-many Order (customer_id nullable for guest); one-to-many ApprovalRequest, RevisionRequest, ReprintRequest; project workspaces and comments scoped by customer + order/job.

### CatalogItem

- **Purpose**: Sellable product or "upload my file" entry; used for storefront browsing and quote entry.
- **Fields**: id, slug (unique), name, description, product_template_id (FK), featured (boolean), sort_order, active, created_at, updated_at. Optional: default_material_id, default_quality_id, image_url.
- **Relations**: Many-to-one ProductTemplate; optional default options for quote prefill.
- **Validation**: Slug URL-safe; at least one CatalogItem can represent "upload my file" (no required product_template for that variant if design allows).

### ProductTemplate / Model

- **Purpose**: Admin-defined template and linked 3D model metadata; drives materials, qualities, pricing.
- **Fields**: ProductTemplate: id, name, description, active, created_at, updated_at. Model: id, product_template_id, file_key (storage reference), format (stl|obj|3mf|…), display_name, created_at.
- **Relations**: ProductTemplate has many Model; ProductTemplate referenced by CatalogItem and PricingProfile/QuoteRule.
- **Validation**: Supported formats whitelist; file_key must reference validated, stored file.

### Job

- **Purpose**: Single quoted unit: one or more files + print options; belongs to quote/cart then order line.
- **Fields**: id, quote_id (nullable when in cart), order_line_id (nullable until checkout). Options: material_id, quality_id, tolerance_class_id, quantity, turnaround_profile_id. File refs: array of upload keys or model ids. Snapshot: unit_price, feasibility_status, lead_time_days (at quote lock). created_at, updated_at.
- **Relations**: Many-to-one Quote; many-to-one OrderLine after checkout; one-to-many PinnedPartComment (by part/file).
- **Validation**: Quantity > 0; options must reference valid admin-configured option ids; file refs must exist and be validated.

### Quote

- **Purpose**: Snapshot of one or more jobs with pricing, feasibility, lead time; "current" (draft) or "locked" when added to cart.
- **Fields**: id, session_id or user_id (guest vs logged-in), status (draft | locked), total_price, currency, valid_until (optional TTL), created_at, updated_at.
- **Relations**: One-to-many Job; locked quote referenced by Cart line items.
- **State**: draft → locked when "add to cart" is confirmed; locked quote is immutable for pricing.

### Cart

- **Purpose**: Session or user-scoped container of quoted jobs; input to checkout.
- **Fields**: id, session_id or customer_id (guest vs logged-in), created_at, updated_at. Lines: cart_line_id, quote_id, job_id (snapshot ref), quantity, locked_unit_price, locked_currency.
- **Relations**: One-to-many CartLine; each line references a locked Job/Quote.
- **Validation**: Only jobs from locked quotes; pricing snapshot must match locked quote.

### Order

- **Purpose**: Post-checkout record; lines (jobs), payment method, payment state, lifecycle stage, customer or guest reference, audit trail.
- **Fields**: id, order_number (human-readable, unique), customer_id (nullable for guest), guest_email (nullable), payment_method (stripe|paypal|cash|invoice|po|quote_request), payment_state (pending|paid|failed|refunded|na), lifecycle_stage (see OrderLifecycleStage), created_at, updated_at. Optional: stripe_payment_intent_id, paypal_order_id, etc., for reconciliation.
- **Relations**: One-to-many OrderLine; many-to-one Customer; one-to-many ApprovalRequest, RevisionRequest, ReprintRequest; one-to-many AuditEvent (order-scoped).
- **Validation**: order_number unique; payment_method must be one of admin-enabled methods at time of checkout.

### OrderLine

- **Purpose**: One line per job in an order; snapshot of job options and price at checkout.
- **Fields**: id, order_id, job_snapshot (JSON or normalized: material, quality, quantity, turnaround, unit_price, file_refs), quantity, line_total, created_at.
- **Relations**: Many-to-one Order; many-to-one Job (source job id for reference); can be linked to ProductionQueue and printer-assignment payload.

### PricingProfile / QuoteRule

- **Purpose**: Admin-configured rules: materials, quality, turnaround → price, feasibility, lead time.
- **Fields**: PricingProfile: id, name, product_template_id (optional), active, created_at, updated_at. QuoteRule: id, pricing_profile_id, material_id, quality_id, tolerance_class_id, turnaround_profile_id (or composite key), unit_price, currency, feasibility_rule (e.g. always_ok|conditional), lead_time_days, min_quantity, max_quantity. Optional: material_recommendations (text or structured).
- **Relations**: QuoteRule many-to-one PricingProfile; PricingProfile optional many-to-one ProductTemplate.
- **Validation**: No overlapping rules that produce ambiguous quote; admin UI must prevent or resolve conflicts.

### PaymentMethodConfig

- **Purpose**: Admin toggle per payment method; stored and read at checkout.
- **Fields**: id, method (stripe|paypal|cash|invoice|po|quote_request), enabled (boolean), sort_order, updated_at. Optional: config_json for provider-specific (e.g. Stripe mode).
- **Validation**: Only one row per method; at least one method enabled for checkout to be available.

### OrderLifecycleStage

- **Purpose**: Status and stage of an order; transitions auditable.
- **Fields**: Order has lifecycle_stage enum or FK to stage: draft|quote_submitted|approval_pending|approved|in_production|ready_to_ship|shipped|completed|cancelled. Optionally OrderLifecycleEvent: order_id, from_stage, to_stage, actor_id, actor_type (customer|admin|system), created_at.
- **Validation**: Allowed transitions defined (e.g. approval_pending → approved or rejected); irreversible actions (e.g. shipped) require audit event.

### ProductionQueue

- **Purpose**: Fulfillment queue of jobs/order lines; supports printer-assignment payload.
- **Fields**: id, name, active, created_at, updated_at. ProductionQueueItem: id, queue_id, order_line_id (or job_id), status (queued|assigned|in_progress|done), printer_assignment_payload_id (nullable, FK to payload/store), created_at, updated_at.
- **Relations**: Many-to-one OrderLine/Job; printer-assignment payload produced when "prepare for connector" is run (see contracts).

### ApprovalRequest / RevisionRequest / ReprintRequest

- **Purpose**: Customer-facing workflow artifacts tied to order/job; visible to fulfillment and customer.
- **Fields**: ApprovalRequest: id, order_id, requested_at, due_at (optional), status (pending|approved|rejected), customer_response_at, customer_notes, admin_notes, created_at, updated_at. RevisionRequest / ReprintRequest: id, order_id, order_line_id (optional), type (revision|reprint), customer_notes, status (pending|accepted|rejected), fulfillment_notes, created_at, updated_at.
- **Relations**: Many-to-one Order; optionally OrderLine for revision/reprint.
- **Validation**: Only one active approval request per order (or per policy); status transitions audited.

### ProjectWorkspace / PinnedPartComment

- **Purpose**: Collaboration tied to job/part; persisted and visible in context.
- **Fields**: ProjectWorkspace: id, order_id, name (optional), created_at, updated_at. PinnedPartComment: id, workspace_id or order_line_id, part_index (or file ref), author_id (customer or admin), author_type, body, created_at, updated_at.
- **Relations**: Many-to-one Order; comments many-to-one workspace or order line.
- **Validation**: Author and body required; no path traversal in body (sanitize if needed).

### AuditEvent (Audit Log)

- **Purpose**: Record actor, timestamp, outcome for order, payment, and config changes.
- **Fields**: id, entity_type (order|payment|config|…), entity_id, action (created|updated|status_change|…), actor_id (nullable), actor_type (customer|admin|system), old_value (JSON, optional), new_value (JSON, optional), created_at.
- **Validation**: Immutable append-only; index by entity_type, entity_id, created_at for queryability and backup.

### PrinterAssignmentPayload (Printer Job Bundle)

- **Purpose**: Well-defined payload for future Bambu Lab connector; no direct printer call in this phase.
- **Fields**: id, order_line_id (or job_id), payload (JSON per contract), status (pending|consumed|failed), created_at, updated_at. Payload shape defined in contracts/printer-job-bundle.md.
- **Relations**: Many-to-one OrderLine/Job; consumed by connector in future phase.

---

## State Transitions

- **Quote**: draft → locked (on add to cart). Locked quote is immutable for pricing.
- **Order payment_state**: pending → paid | failed; paid → refunded (optional).
- **Order lifecycle_stage**: quote_submitted → approval_pending → approved → in_production → ready_to_ship → shipped → completed; or cancelled from appropriate states. approval_pending can → rejected (then admin may cancel or request revision).
- **ApprovalRequest**: pending → approved | rejected.
- **RevisionRequest / ReprintRequest**: pending → accepted | rejected.
- **ProductionQueueItem**: queued → assigned → in_progress → done. Optional: assigned when printer-assignment payload is created and marked "ready for connector."

---

## Validation Rules (from FRs)

- File uploads: type whitelist (STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD, USDZ, USDA, USDC, ZIP); max size and safe ZIP extraction; no path traversal; server-side validation only.
- Checkout: only admin-enabled payment methods; order created with chosen method and initial payment_state.
- Guest orders: guest_email optional but required for "link to account" later; order_number and optional token for status lookup.
- Audit: every order status change, payment state change, and config change (e.g. payment method toggle) must write an AuditEvent.
