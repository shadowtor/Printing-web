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
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Catalog</h1>
        <p className="text-brand-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-h1 text-white">Catalog</h1>
      {error && <p className="text-red-200">{error}</p>}
      <div className="panel p-4">
        <h2 className="mb-2 text-lg font-medium text-brand-text">Catalog items</h2>
        {items.length === 0 ? (
          <p className="text-brand-muted">No catalog items.</p>
        ) : (
          <ul className="space-y-2">
            {(items as { id: string; slug?: string; name?: string }[]).map((item) => (
              <li key={item.id}>
                <span className="font-mono text-brand-text">{item.slug ?? item.id}</span>
                <span className="ml-2 text-brand-muted">{item.name ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="panel-soft p-4">
        <h2 className="mb-2 text-lg font-medium text-brand-text">Product templates</h2>
        {templates.length === 0 ? (
          <p className="text-brand-muted">No product templates.</p>
        ) : (
          <ul className="space-y-2">
            {(templates as { id: string; name?: string }[]).map((t) => (
              <li key={t.id}>
                <Link href={`/admin/catalog?template=${t.id}`} className="font-semibold text-brand-accent hover:text-white">
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
