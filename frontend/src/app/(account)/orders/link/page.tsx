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
    router.replace("/login");
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
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="font-[var(--font-heading)] text-h1 text-white">Link guest order</h1>
      <p className="text-body text-brand-muted">
        Enter the order number from your guest checkout confirmation. The order&apos;s guest email must match your account email.
      </p>
      <form onSubmit={onSubmit} className="panel space-y-4 p-6">
        {error && <p className="text-sm text-red-200">{error}</p>}
        {success && <p className="text-sm text-brand-accent">{success}</p>}
        <div>
          <label className="block text-sm font-medium text-brand-muted">Order number</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-20250316-ABCD"
            className="form-input mt-1 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !orderNumber.trim()}
          className="btn-primary w-full py-2.5"
        >
          {submitting ? "Linking…" : "Link order"}
        </button>
      </form>
      <p>
        <Link href="/orders" className="btn-secondary">
          Back to My orders
        </Link>
      </p>
    </section>
  );
}
