"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminListOrders, type AdminOrder } from "../../../services/api/admin-client";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListOrders({ limit: 50 })
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      {error && <p className="text-amber-300">{error}</p>}
      {orders.length === 0 && !error && (
        <p className="text-slate-400">No orders.</p>
      )}
      {orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
              >
                <div className="flex justify-between">
                  <span className="font-mono font-medium text-slate-100">{order.orderNumber}</span>
                  <span className="text-sm text-slate-400">{formatDate(order.createdAt)}</span>
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {order.lifecycleStage} · {order.paymentState}
                  {order.guestEmail && ` · ${order.guestEmail}`}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
