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
        <h1 className="font-[var(--font-heading)] text-h1 text-white">
          Order confirmation
        </h1>
        <p className="text-body text-brand-muted">
          No order reference found. You may have arrived here by mistake.
        </p>
        <Link
          href="/"
          className="btn-secondary"
        >
          Return to storefront
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-h1 text-white">
        Thank you for your order
      </h1>
      <div className="panel p-6">
        <p className="text-sm text-brand-muted">
          Your order has been placed successfully.
        </p>
        <p className="mt-2 font-mono text-lg font-semibold text-brand-accent">
          Order number: {orderNumber}
        </p>
        {orderId && (
          <p className="mt-1 text-xs text-brand-subtle">
            Order ID: {orderId}
          </p>
        )}
        <p className="mt-4 text-sm text-brand-subtle">
          Save this reference to track your order or contact support.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/"
          className="btn-secondary"
        >
          Back to storefront
        </Link>
        <Link
          href="/quote"
          className="btn-primary"
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
          <h1 className="font-[var(--font-heading)] text-h1 text-white">
            Order confirmation
          </h1>
          <p className="text-brand-muted">Loading…</p>
        </section>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
