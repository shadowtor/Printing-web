import { authHeaders } from "./auth-client.js";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = { ...authHeaders(), ...(options.headers as Record<string, string>) };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) throw new Error("Unauthorized");
  return res;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  paymentMethod: string;
  paymentState: string;
  lifecycleStage: string;
  createdAt: string;
  lines: unknown[];
}

export async function getMyOrders(): Promise<OrderSummary[]> {
  const res = await fetchWithAuth(`${API_BASE}/orders`);
  if (!res.ok) throw new Error("Failed to load orders");
  return (await res.json()) as OrderSummary[];
}

export async function getOrderDetail(orderId: string): Promise<unknown> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Order not found");
    throw new Error("Failed to load order");
  }
  return res.json();
}

export async function getOrderTimeline(orderId: string): Promise<{ timeline: unknown[] }> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/timeline`);
  if (!res.ok) throw new Error("Failed to load timeline");
  return (await res.json()) as { timeline: unknown[] };
}

export async function getApprovalRequest(orderId: string): Promise<unknown | null> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/approval-request`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load approval request");
  return res.json();
}

export async function respondToApproval(
  orderId: string,
  data: { approved: boolean; customerNotes?: string }
): Promise<unknown> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/approval-request/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to submit response");
  return res.json();
}

export async function createRevisionRequest(
  orderId: string,
  data: { orderLineId?: string; customerNotes?: string }
): Promise<unknown> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/revision-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create revision request");
  return res.json();
}

export async function createReprintRequest(
  orderId: string,
  data: { orderLineId?: string; customerNotes?: string }
): Promise<unknown> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/reprint-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create reprint request");
  return res.json();
}

export async function getWorkspace(orderId: string): Promise<unknown | null> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/workspace`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load workspace");
  return res.json();
}

export async function addWorkspaceComment(
  orderId: string,
  data: { body: string; orderLineId?: string; partIndex?: number }
): Promise<unknown> {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/workspace/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function linkGuestOrder(params: {
  orderNumber?: string;
  orderId?: string;
}): Promise<{ linked: boolean; orderId: string; orderNumber: string }> {
  const res = await fetchWithAuth(`${API_BASE}/guest-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const data = (await res.json()) as { message?: string };
    throw new Error(data.message ?? "Failed to link order");
  }
  return res.json() as Promise<{ linked: boolean; orderId: string; orderNumber: string }>;
}
