"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminGetOrder,
  adminUpdateOrder,
  type AdminOrder
} from "../../../../services/api/admin-client";

const LIFECYCLE_STAGES = [
  "draft",
  "quote_submitted",
  "approval_pending",
  "approved",
  "in_production",
  "ready_to_ship",
  "shipped",
  "completed",
  "cancelled"
];
const PAYMENT_STATES = ["pending", "paid", "failed", "refunded", "na"];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [order, setOrder] = useState<(AdminOrder & { timeline?: unknown[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lifecycleStage, setLifecycleStage] = useState("");
  const [paymentState, setPaymentState] = useState("");

  useEffect(() => {
    if (!id) return;
    adminGetOrder(id)
      .then((o) => {
        setOrder(o);
        setLifecycleStage(o.lifecycleStage ?? "");
        setPaymentState(o.paymentState ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await adminUpdateOrder(order.id, {
        lifecycleStage: lifecycleStage || undefined,
        paymentState: paymentState || undefined
      });
      setOrder((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  if (error && !order) {
    return (
      <section className="space-y-4">
        <p className="text-amber-300">{error}</p>
        <Link href="/admin/orders" className="text-emerald-400 hover:underline">
          Back to orders
        </Link>
      </section>
    );
  }

  if (!order) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight font-mono">{order.orderNumber}</h1>
        <Link href="/admin/orders" className="text-sm text-slate-400 hover:text-emerald-400">
          ← Orders
        </Link>
      </div>
      {error && <p className="text-amber-300">{error}</p>}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <p className="text-sm text-slate-400">ID: {order.id}</p>
        <p className="text-sm">Lifecycle: {order.lifecycleStage} · Payment: {order.paymentState}</p>
        {order.guestEmail && <p className="text-sm text-slate-400">Guest: {order.guestEmail}</p>}
      </div>
      <form onSubmit={handleUpdate} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <h2 className="font-medium text-slate-200">Update order</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-slate-400">Lifecycle stage</label>
            <select
              value={lifecycleStage}
              onChange={(e) => setLifecycleStage(e.target.value)}
              className="mt-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            >
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400">Payment state</label>
            <select
              value={paymentState}
              onChange={(e) => setPaymentState(e.target.value)}
              className="mt-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            >
              {PAYMENT_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={updating}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {updating ? "Saving…" : "Save"}
        </button>
      </form>
      {order.lines && (order.lines as unknown[]).length > 0 && (
        <div>
          <h2 className="font-medium text-slate-200 mb-2">Lines</h2>
          <ul className="space-y-2">
            {(order.lines as { id: string; jobId: string; quantity: number; lineTotal: number }[]).map((line) => (
              <li key={line.id} className="rounded border border-slate-800 px-3 py-2 text-sm">
                Job {line.jobId} · qty {line.quantity} · {line.lineTotal}¢
              </li>
            ))}
          </ul>
        </div>
      )}
      {order.timeline && (order.timeline as unknown[]).length > 0 && (
        <div>
          <h2 className="font-medium text-slate-200 mb-2">Timeline</h2>
          <ul className="space-y-1 text-sm text-slate-400">
            {(order.timeline as { label?: string; stage?: string }[]).map((t, i) => (
              <li key={i}>{t.label ?? t.stage ?? "—"}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
