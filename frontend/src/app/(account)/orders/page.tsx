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
      router.replace("/auth/login");
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
        <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
        <div className="flex gap-2">
          <Link
            href="/account/orders/link"
            className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Link guest order
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            Storefront
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-amber-300">{error}</p>
      )}

      {orders.length === 0 && !error && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center">
          <p className="text-slate-300">You have no orders yet.</p>
          <Link href="/quote" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
            Get a quote
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
              >
                <div className="flex justify-between">
                  <span className="font-mono font-medium text-slate-100">{order.orderNumber}</span>
                  <span className="text-sm text-slate-400">{formatDate(order.createdAt)}</span>
                </div>
                <div className="mt-1 text-sm text-slate-400">
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
