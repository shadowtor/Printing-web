# Public API (Storefront & Customer)

**Base path**: `/api/v1` (or as configured).  
**Auth**: Session or JWT for customer endpoints; many storefront endpoints are unauthenticated.  
**Errors**: `{ "code": "string", "message": "string", "details": object? }`; HTTP status 4xx/5xx. User-safe messages only (FR-022).

---

## Storefront (unauthenticated)

### Catalog

- `GET /catalog/items` — List catalog items (active, optional featured). Query: `featured=true`. Response: `{ items: [{ id, slug, name, description, imageUrl?, featured, productTemplateId }] }`.
- `GET /catalog/items/:slug` — Single catalog item; includes default options for quote prefill.

### Upload & Quote

- `POST /upload` — Multipart; validate and store file(s). Allowed types: STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD, USDZ, USDA, USDC, ZIP. Max size and safe extraction per config. Response: `{ fileKeys: string[], errors?: [] }`. Explicit errors for invalid type/size/path (FR-005).
- `POST /quote/estimate` — Body: `{ fileKeys?: string[], catalogItemId?: string, options: { materialId, qualityId, toleranceClassId, quantity, turnaroundProfileId } }`. Response: `{ quoteId, jobs: [{ jobId, unitPrice, feasibility, leadTimeDays, materialRecommendations? }], totalPrice, currency, validUntil? }`. Uses admin-configured pricing and quote rules (FR-004).
- `POST /quote/lock` — Lock current quote (e.g. from session) for cart. Response: `{ quoteId, status: "locked" }`.

### Cart & Checkout

- `GET /cart` — Current cart (session or customer). Response: `{ lines: [{ quoteId, jobId, quantity, lockedUnitPrice, lineTotal }], total, currency }`.
- `POST /cart/lines` — Add line: `{ quoteId, jobId, quantity }`. Response: updated cart.
- `PATCH /cart/lines/:lineId` — Update quantity or remove (quantity 0).
- `GET /checkout/payment-methods` — List enabled payment methods only (FR-007). Response: `[{ method: "stripe"|"paypal"|"cash"|"invoice"|"po"|"quote_request", label }]`.
- `POST /checkout` — Create order. Body: `{ paymentMethod, guestEmail?, shippingAddress?, idempotencyKey? }`. Response: `{ orderId, orderNumber, paymentState, nextStep: { type: "redirect"|"confirmation"|"quote_submitted", url? } }`. For Stripe/PayPal, nextStep may include redirect URL (FR-008, FR-009).

---

## Customer (authenticated)

### Account

- `POST /auth/register` — Body: `{ email, password, name, ... }`. Response: session/token and customer id.
- `POST /auth/login` — Body: `{ email, password }`. Response: session/token.
- `POST /auth/link-guest-orders` — Link guest orders to current user by email match (optional confirmation). Body: `{ email }`. Response: `{ linkedOrderIds }` (FR-009).

### Orders

- `GET /orders` — List customer orders. Response: `{ orders: [{ id, orderNumber, status, paymentState, createdAt, summary }] }`.
- `GET /orders/:id` — Order detail; includes lines, timeline, approval/revision/reprint requests, workspace (FR-010, FR-013).

### Approvals & Requests

- `GET /orders/:orderId/approval-request` — Current approval request if any.
- `POST /orders/:orderId/approval-request/respond` — Body: `{ status: "approved"|"rejected", notes? }`. Response: updated request (FR-011).
- `POST /orders/:orderId/revision-request` — Body: `{ orderLineId?, notes }`. Response: `{ requestId, status }` (FR-012).
- `POST /orders/:orderId/reprint-request` — Body: `{ orderLineId?, notes }`. Response: `{ requestId, status }` (FR-012).

### Workspace & Comments

- `GET /orders/:orderId/workspace` — Project workspace and pinned part comments (FR-013).
- `POST /orders/:orderId/workspace/comments` — Body: `{ orderLineId?, partIndex?, body }`. Response: `{ commentId, createdAt }`.

---

## Webhooks (inbound, from payment providers)

- `POST /webhooks/stripe` — Stripe webhook; verify signature; handle payment_intent.succeeded, checkout.session.completed; reconcile order payment state; idempotent (FR-008).
- `POST /webhooks/paypal` — PayPal webhook; verify signature; handle order capture; reconcile order payment state; idempotent (FR-008).
