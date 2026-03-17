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
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Queues</h1>
        <p className="text-brand-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-h1 text-white">Production queues</h1>
      {error && <p className="text-red-200">{error}</p>}
      {queues.length === 0 && !error && (
        <p className="text-brand-muted">No queues.</p>
      )}
      {queues.length > 0 && (
        <ul className="space-y-3">
          {(queues as { id: string; name?: string; active?: boolean; items?: unknown[] }[]).map((q) => (
            <li key={q.id}>
              <Link
                href={`/admin/queues/${q.id}`}
                className="panel-soft block p-4 transition hover:border-brand-primary/40"
              >
                <span className="font-medium text-brand-text">{q.name ?? q.id}</span>
                {q.active === false && <span className="ml-2 text-brand-subtle">(inactive)</span>}
                {Array.isArray(q.items) && (
                  <span className="ml-2 text-sm text-brand-muted">{q.items.length} items</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
