"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");

  if (!orderNumber) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Order confirmation
        </h1>
        <p className="text-slate-300">
          No order reference found. You may have arrived here by mistake.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Return to storefront
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Thank you for your order
      </h1>
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-6">
        <p className="text-sm text-slate-300">
          Your order has been placed successfully.
        </p>
        <p className="mt-2 font-mono text-lg font-semibold text-emerald-200">
          Order number: {orderNumber}
        </p>
        {orderId && (
          <p className="mt-1 text-xs text-slate-400">
            Order ID: {orderId}
          </p>
        )}
        <p className="mt-4 text-sm text-slate-400">
          Save this reference to track your order or contact support.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
        >
          Back to storefront
        </Link>
        <Link
          href="/quote"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Get another quote
        </Link>
      </div>
    </section>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Order confirmation
          </h1>
          <p className="text-slate-400">Loading…</p>
        </section>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
