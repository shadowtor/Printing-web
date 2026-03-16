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
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-amber-300">{error}</p>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Order count</p>
          <p className="text-2xl font-semibold text-slate-100">{summary.orderCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Total revenue (cents)</p>
          <p className="text-2xl font-semibold text-slate-100">{summary.totalRevenueCents}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 min-w-[220px]">
          <h2 className="text-sm font-medium text-slate-300 mb-2">By lifecycle stage</h2>
          <ul className="text-sm text-slate-400 space-y-1">
            {Object.entries(summary.byLifecycleStage).map(([k, v]) => (
              <li key={k}>{k}: {v}</li>
            ))}
            {Object.keys(summary.byLifecycleStage).length === 0 && <li>—</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 min-w-[220px]">
          <h2 className="text-sm font-medium text-slate-300 mb-2">By payment state</h2>
          <ul className="text-sm text-slate-400 space-y-1">
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
