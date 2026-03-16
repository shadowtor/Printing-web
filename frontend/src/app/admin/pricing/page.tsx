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
        <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
      {error && <p className="text-amber-300">{error}</p>}
      <div>
        <h2 className="text-lg font-medium text-slate-200 mb-2">Pricing profiles</h2>
        {profiles.length === 0 ? (
          <p className="text-slate-400">No pricing profiles.</p>
        ) : (
          <ul className="space-y-2">
            {(profiles as { id: string; name?: string; active?: boolean }[]).map((p) => (
              <li key={p.id} className="rounded border border-slate-800 bg-slate-900/60 px-3 py-2">
                <span className="font-medium text-slate-200">{p.name ?? p.id}</span>
                {p.active === false && <span className="ml-2 text-slate-500">(inactive)</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
