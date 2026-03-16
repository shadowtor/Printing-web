"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminGetQueue } from "../../../../services/api/admin-client";

export default function AdminQueueDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [queue, setQueue] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminGetQueue(id)
      .then(setQueue)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <section className="space-y-4">
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  if (error || !queue) {
    return (
      <section className="space-y-4">
        <p className="text-amber-300">{error ?? "Not found"}</p>
        <Link href="/admin/queues" className="text-emerald-400 hover:underline">
          Back to queues
        </Link>
      </section>
    );
  }

  const q = queue as { id: string; name?: string; active?: boolean; items?: unknown[] };
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{q.name ?? q.id}</h1>
        <Link href="/admin/queues" className="text-sm text-slate-400 hover:text-emerald-400">
          ← Queues
        </Link>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-400">ID: {q.id}</p>
        {q.active === false && <p className="text-slate-500">Inactive</p>}
      </div>
      {Array.isArray(q.items) && q.items.length > 0 && (
        <div>
          <h2 className="font-medium text-slate-200 mb-2">Items ({q.items.length})</h2>
          <ul className="space-y-2">
            {(q.items as { id: string; orderLineId?: string; status?: string }[]).map((item) => (
              <li key={item.id} className="rounded border border-slate-800 px-3 py-2 text-sm text-slate-300">
                Line {item.orderLineId ?? item.id} · {item.status ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(!Array.isArray(q.items) || q.items.length === 0) && (
        <p className="text-slate-400">No items in this queue.</p>
      )}
    </section>
  );
}
