"use client";

import { useEffect, useState } from "react";
import { adminGetAnalyticsSummary, type AdminAnalyticsSummary } from "../../../services/api/admin-client";

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetAnalyticsSummary()
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Analytics</h1>
        <p className="text-red-200">{error}</p>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="space-y-4">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Analytics</h1>
        <p className="text-brand-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-h1 text-white">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-4">
          <p className="text-sm text-brand-muted">Order count</p>
          <p className="text-2xl font-semibold text-brand-text">{summary.orderCount}</p>
        </div>
        <div className="panel p-4">
          <p className="text-sm text-brand-muted">Total revenue (cents)</p>
          <p className="text-2xl font-semibold text-brand-accent">{summary.totalRevenueCents}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="panel-soft min-w-[220px] p-4">
          <h2 className="mb-2 text-sm font-medium text-brand-text">By lifecycle stage</h2>
          <ul className="space-y-1 text-sm text-brand-muted">
            {Object.entries(summary.byLifecycleStage).map(([k, v]) => (
              <li key={k}>{k}: {v}</li>
            ))}
            {Object.keys(summary.byLifecycleStage).length === 0 && <li>—</li>}
          </ul>
        </div>
        <div className="panel-soft min-w-[220px] p-4">
          <h2 className="mb-2 text-sm font-medium text-brand-text">By payment state</h2>
          <ul className="space-y-1 text-sm text-brand-muted">
            {Object.entries(summary.byPaymentState).map(([k, v]) => (
              <li key={k}>{k}: {v}</li>
            ))}
            {Object.keys(summary.byPaymentState).length === 0 && <li>—</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
