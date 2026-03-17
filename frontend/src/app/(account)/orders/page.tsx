"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredToken } from "../../../services/api/auth-client";
import { getMyOrders, type OrderSummary } from "../../../services/api/account-client";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <section className="space-y-6">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">My orders</h1>
        <p className="text-brand-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">My orders</h1>
        <div className="flex gap-2">
          <Link
            href="/orders/link"
            className="btn-secondary"
          >
            Link guest order
          </Link>
          <Link href="/" className="btn-secondary">
            Storefront
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-red-200">{error}</p>
      )}

      {orders.length === 0 && !error && (
        <div className="panel p-6 text-center">
          <p className="text-brand-muted">You have no orders yet.</p>
          <Link href="/quote" className="btn-primary mt-3">
            Get a quote
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="panel-soft block p-4 transition hover:border-brand-primary/40"
              >
                <div className="flex justify-between">
                  <span className="font-mono font-medium text-brand-text">{order.orderNumber}</span>
                  <span className="text-sm text-brand-subtle">{formatDate(order.createdAt)}</span>
                </div>
                <div className="mt-1 text-sm text-brand-muted">
                  {order.lifecycleStage} · {order.paymentState}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
