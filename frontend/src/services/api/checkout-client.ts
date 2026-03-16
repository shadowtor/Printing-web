const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";

const SESSION_KEY = "printing-web-session-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface CartLine {
  id: string;
  cartId: string;
  quoteId: string;
  jobId: string;
  quantity: number;
  lockedUnitPrice: number;
  currency: string;
}

export interface CartResponse {
  cart: { id: string; sessionId: string | null; customerId: string | null } | null;
  lines: CartLine[];
  totalItems: number;
  totalCents: number;
  currency: string;
}

export interface PaymentMethodItem {
  method: string;
  sortOrder: number;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
}

export async function getCart(): Promise<CartResponse> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/cart?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error("Failed to load cart");
  return (await res.json()) as CartResponse;
}

export async function addCartLine(params: {
  quoteId: string;
  jobId: string;
  quantity: number;
}): Promise<CartLine> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/cart/lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      quoteId: params.quoteId,
      jobId: params.jobId,
      quantity: params.quantity
    })
  });
  if (!res.ok) {
    const data = (await res.json()) as { message?: string; code?: string };
    throw new Error(data.message ?? "Failed to add to cart");
  }
  return (await res.json()) as CartLine;
}

export async function updateCartLineQuantity(
  lineId: string,
  quantity: number
): Promise<CartLine> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/cart/lines/${encodeURIComponent(lineId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, quantity })
  });
  if (!res.ok) throw new Error("Failed to update cart line");
  return (await res.json()) as CartLine;
}

export async function removeCartLine(lineId: string): Promise<void> {
  const sessionId = getSessionId();
  const res = await fetch(
    `${API_BASE}/cart/lines/${encodeURIComponent(lineId)}?sessionId=${encodeURIComponent(sessionId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to remove from cart");
}

export async function getPaymentMethods(): Promise<PaymentMethodItem[]> {
  const res = await fetch(`${API_BASE}/checkout/payment-methods`);
  if (!res.ok) throw new Error("Failed to load payment methods");
  return (await res.json()) as PaymentMethodItem[];
}

export async function checkout(params: {
  paymentMethod: string;
  guestEmail?: string;
}): Promise<CheckoutResult> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      paymentMethod: params.paymentMethod,
      guestEmail: params.guestEmail
    })
  });
  if (!res.ok) {
    const data = (await res.json()) as { message?: string; code?: string };
    throw new Error(data.message ?? "Checkout failed");
  }
  return (await res.json()) as CheckoutResult;
}

export { getSessionId };
