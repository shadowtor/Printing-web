"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAdminToken, clearAdminToken, adminGetAnalyticsSummary } from "../../../services/api/admin-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setAdminToken(secret);
      await adminGetAnalyticsSummary();
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Invalid admin secret");
      clearAdminToken();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        {error && <p className="text-sm text-amber-300">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-slate-200">Admin secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-400">
        <Link href="/" className="text-emerald-400 hover:underline">
          Back to storefront
        </Link>
      </p>
    </section>
  );
}
