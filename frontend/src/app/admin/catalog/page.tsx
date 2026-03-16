"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminListCatalogItems, adminListProductTemplates } from "../../../services/api/admin-client";

export default function AdminCatalogPage() {
  const [items, setItems] = useState<unknown[]>([]);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminListCatalogItems(), adminListProductTemplates()])
      .then(([i, t]) => {
        setItems(Array.isArray(i) ? i : []);
        setTemplates(Array.isArray(t) ? t : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
      {error && <p className="text-amber-300">{error}</p>}
      <div>
        <h2 className="text-lg font-medium text-slate-200 mb-2">Catalog items</h2>
        {items.length === 0 ? (
          <p className="text-slate-400">No catalog items.</p>
        ) : (
          <ul className="space-y-2">
            {(items as { id: string; slug?: string; name?: string }[]).map((item) => (
              <li key={item.id}>
                <span className="font-mono text-slate-300">{item.slug ?? item.id}</span>
                <span className="text-slate-400 ml-2">{item.name ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="text-lg font-medium text-slate-200 mb-2">Product templates</h2>
        {templates.length === 0 ? (
          <p className="text-slate-400">No product templates.</p>
        ) : (
          <ul className="space-y-2">
            {(templates as { id: string; name?: string }[]).map((t) => (
              <li key={t.id}>
                <Link href={`/admin/catalog?template=${t.id}`} className="text-emerald-400 hover:underline">
                  {t.name ?? t.id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
