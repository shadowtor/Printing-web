"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, setStoredToken } from "../../../services/api/auth-client";
import { Logo } from "../../../components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      setStoredToken(result.token);
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="panel px-6 py-8">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>
        <h1 className="text-center font-[var(--font-heading)] text-h1 text-white">Sign in</h1>
        <p className="mt-2 text-center text-body text-brand-muted">
          Access your orders, approvals, and workspace updates.
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel space-y-4 p-6">
        {error && (
          <p className="text-sm text-red-200">{error}</p>
        )}
        <div>
          <label className="block text-sm font-medium text-brand-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-accent hover:text-white">
          Register
        </Link>
      </p>
    </section>
  );
}
