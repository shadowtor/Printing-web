const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";
const ADMIN_TOKEN_KEY = "printing-web-admin-token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(secret: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADMIN_TOKEN_KEY, `admin:${secret}`);
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchAdmin(url: string, options: RequestInit = {}) {
  const headers = { ...adminHeaders(), ...(options.headers as Record<string, string>) };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) throw new Error("Unauthorized");
  return res;
}

const adminBase = `${API_BASE}/admin`;

// Catalog
export async function adminListCatalogItems(): Promise<unknown[]> {
  const res = await fetchAdmin(`${adminBase}/catalog/items`);
  if (!res.ok) throw new Error("Failed to load catalog items");
  return (await res.json()) as unknown[];
}

export async function adminGetCatalogItem(id: string): Promise<unknown> {
  const res = await fetchAdmin(`${adminBase}/catalog/items/${id}`);
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error("Failed to load catalog item");
  return res.json();
}

export async function adminListProductTemplates(): Promise<unknown[]> {
  const res = await fetchAdmin(`${adminBase}/product-templates`);
  if (!res.ok) throw new Error("Failed to load product templates");
  return (await res.json()) as unknown[];
}

// Pricing
export async function adminListPricingProfiles(): Promise<unknown[]> {
  const res = await fetchAdmin(`${adminBase}/pricing/profiles`);
  if (!res.ok) throw new Error("Failed to load pricing profiles");
  return (await res.json()) as unknown[];
}

// Payment methods
export async function adminListPaymentMethods(): Promise<unknown[]> {
  const res = await fetchAdmin(`${adminBase}/payment-methods`);
  if (!res.ok) throw new Error("Failed to load payment methods");
  return (await res.json()) as unknown[];
}

// Orders
export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  guestEmail?: string | null;
  paymentMethod: string;
  paymentState: string;
  lifecycleStage: string;
  createdAt: string;
  lines: unknown[];
}

export async function adminListOrders(params?: {
  lifecycleStage?: string;
  paymentState?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminOrder[]> {
  const q = new URLSearchParams();
  if (params?.lifecycleStage) q.set("lifecycleStage", params.lifecycleStage);
  if (params?.paymentState) q.set("paymentState", params.paymentState);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const res = await fetchAdmin(`${adminBase}/orders?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to load orders");
  return (await res.json()) as AdminOrder[];
}

export async function adminGetOrder(id: string): Promise<AdminOrder & { timeline?: unknown[] }> {
  const res = await fetchAdmin(`${adminBase}/orders/${id}`);
  if (res.status === 404) throw new Error("Order not found");
  if (!res.ok) throw new Error("Failed to load order");
  return (await res.json()) as AdminOrder & { timeline?: unknown[] };
}

export async function adminUpdateOrder(
  id: string,
  data: { lifecycleStage?: string; paymentState?: string }
): Promise<AdminOrder> {
  const res = await fetchAdmin(`${adminBase}/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update order");
  return (await res.json()) as AdminOrder;
}

// Queues
export async function adminListQueues(): Promise<unknown[]> {
  const res = await fetchAdmin(`${adminBase}/queues`);
  if (!res.ok) throw new Error("Failed to load queues");
  return (await res.json()) as unknown[];
}

export async function adminGetQueue(id: string): Promise<unknown> {
  const res = await fetchAdmin(`${adminBase}/queues/${id}`);
  if (res.status === 404) throw new Error("Queue not found");
  if (!res.ok) throw new Error("Failed to load queue");
  return res.json();
}

export async function adminListQueueItems(queueId: string): Promise<unknown[]> {
  const res = await fetchAdmin(`${adminBase}/queues/${queueId}/items`);
  if (!res.ok) throw new Error("Failed to load queue items");
  return (await res.json()) as unknown[];
}

// Analytics
export interface AdminAnalyticsSummary {
  orderCount: number;
  totalRevenueCents: number;
  byLifecycleStage: Record<string, number>;
  byPaymentState: Record<string, number>;
}

export async function adminGetAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const res = await fetchAdmin(`${adminBase}/analytics/summary`);
  if (!res.ok) throw new Error("Failed to load analytics");
  return (await res.json()) as AdminAnalyticsSummary;
}

// Ops
export interface AdminOpsEnv {
  valid: boolean;
  required: string[];
  present: string[];
  missing: string[];
}

export async function adminGetOpsEnv(): Promise<AdminOpsEnv> {
  const res = await fetchAdmin(`${adminBase}/ops/env`);
  if (!res.ok) throw new Error("Failed to load env status");
  return (await res.json()) as AdminOpsEnv;
}

export async function adminTriggerBackup(): Promise<{ accepted: boolean; message?: string }> {
  const res = await fetchAdmin(`${adminBase}/ops/backup`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger backup");
  return (await res.json()) as { accepted: boolean; message?: string };
}
