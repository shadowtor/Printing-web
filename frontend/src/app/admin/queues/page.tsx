"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminListQueues } from "../../../services/api/admin-client";

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListQueues()
      .then((q) => setQueues(Array.isArray(q) ? q : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Queues</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Production queues</h1>
      {error && <p className="text-amber-300">{error}</p>}
      {queues.length === 0 && !error && (
        <p className="text-slate-400">No queues.</p>
      )}
      {queues.length > 0 && (
        <ul className="space-y-3">
          {(queues as { id: string; name?: string; active?: boolean; items?: unknown[] }[]).map((q) => (
            <li key={q.id}>
              <Link
                href={`/admin/queues/${q.id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
              >
                <span className="font-medium text-slate-200">{q.name ?? q.id}</span>
                {q.active === false && <span className="ml-2 text-slate-500">(inactive)</span>}
                {Array.isArray(q.items) && (
                  <span className="ml-2 text-sm text-slate-400">{q.items.length} items</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
