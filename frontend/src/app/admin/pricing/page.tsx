"use client";

import { useEffect, useState } from "react";
import { adminListPricingProfiles } from "../../../services/api/admin-client";

export default function AdminPricingPage() {
  const [profiles, setProfiles] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListPricingProfiles()
      .then((p) => setProfiles(Array.isArray(p) ? p : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Pricing</h1>
        <p className="text-brand-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-h1 text-white">Pricing</h1>
      {error && <p className="text-red-200">{error}</p>}
      <div className="panel p-4">
        <h2 className="mb-2 text-lg font-medium text-brand-text">Pricing profiles</h2>
        {profiles.length === 0 ? (
          <p className="text-brand-muted">No pricing profiles.</p>
        ) : (
          <ul className="space-y-2">
            {(profiles as { id: string; name?: string; active?: boolean }[]).map((p) => (
              <li key={p.id} className="rounded-lg border border-brand-border bg-brand-surfaceSoft px-3 py-2">
                <span className="font-medium text-brand-text">{p.name ?? p.id}</span>
                {p.active === false && <span className="ml-2 text-brand-subtle">(inactive)</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
