"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredToken } from "../../../../services/api/auth-client";
import { linkGuestOrder } from "../../../../services/api/account-client";

export default function LinkGuestOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const token = getStoredToken();
  if (typeof window !== "undefined" && !token) {
    router.replace("/auth/login");
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const num = orderNumber.trim();
    if (!num) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await linkGuestOrder({ orderNumber: num });
      setSuccess(`Order ${result.orderNumber} is now linked to your account.`);
      setOrderNumber("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Link guest order</h1>
      <p className="text-sm text-slate-400">
        Enter the order number from your guest checkout confirmation. The order&apos;s guest email must match your account email.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        {error && <p className="text-sm text-amber-300">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}
        <div>
          <label className="block text-sm font-medium text-slate-200">Order number</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-20250316-ABCD"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !orderNumber.trim()}
          className="w-full rounded bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Linking…" : "Link order"}
        </button>
      </form>
      <p>
        <Link href="/account/orders" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to My orders
        </Link>
      </p>
    </section>
  );
}
