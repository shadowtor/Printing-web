"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAdminToken, clearAdminToken, adminGetAnalyticsSummary } from "../../../services/api/admin-client";
import { Logo } from "../../../components/logo";

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
    <section className="mx-auto max-w-xl space-y-6">
      <div className="panel p-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Admin sign in</h1>
        <p className="mt-2 text-body text-brand-muted">
          Secure access for operations, queue management, and analytics.
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel space-y-4 p-6">
        {error && <p className="text-sm text-red-200">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-brand-muted">Admin secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
            autoComplete="current-password"
            className="form-input mt-1"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-2.5"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted">
        <Link href="/" className="font-semibold text-brand-accent hover:text-white">
          Back to storefront
        </Link>
      </p>
    </section>
  );
}
