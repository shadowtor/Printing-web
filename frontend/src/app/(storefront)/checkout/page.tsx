"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCart,
  getPaymentMethods,
  checkout,
  type PaymentMethodItem
} from "../../../services/api/checkout-client";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2
  }).format(cents / 100);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<{
    totalCents: number;
    totalItems: number;
    lines: unknown[];
  } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cartData, methods] = await Promise.all([getCart(), getPaymentMethods()]);
        setCart({
          totalCents: cartData.totalCents,
          totalItems: cartData.totalItems,
          lines: cartData.lines
        });
        setPaymentMethods(methods);
        if (methods.length > 0 && !selectedMethod) {
          setSelectedMethod(methods[0]?.method ?? "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    }
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMethod || !cart || cart.lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await checkout({
        paymentMethod: selectedMethod,
        guestEmail: guestEmail.trim() || undefined
      });
      router.push(
        `/checkout/confirmation?orderNumber=${encodeURIComponent(result.orderNumber)}&orderId=${encodeURIComponent(result.orderId)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart) {
    return (
      <section className="space-y-6">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Checkout</h1>
        {error ? <p className="text-red-200">{error}</p> : <p className="text-brand-muted">Loading...</p>}
      </section>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <section className="space-y-6">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Checkout</h1>
        <p className="text-body text-brand-muted">Your cart is empty.</p>
        <Link href="/cart" className="btn-secondary">
          View cart
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Checkout</h1>
        <Link href="/cart" className="btn-secondary">
          Back to cart
        </Link>
      </div>

      {error && (
        <div className="rounded-panel border border-brand-danger/40 bg-brand-danger/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="panel p-5">
            <h2 className="font-[var(--font-heading)] text-h2 text-white">Payment method</h2>
            <div className="mt-4 space-y-2">
              {paymentMethods.map((m) => (
                <label
                  key={m.method}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border bg-brand-surfaceSoft px-3 py-2 hover:border-brand-primary/50"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.method}
                    checked={selectedMethod === m.method}
                    onChange={() => setSelectedMethod(m.method)}
                    className="text-brand-primary"
                  />
                  <span className="capitalize text-brand-text">{m.method}</span>
                </label>
              ))}
            </div>
            {paymentMethods.length === 0 && (
              <p className="mt-2 text-sm text-brand-subtle">No payment methods configured. Contact support.</p>
            )}
          </div>

          <div className="panel-soft p-5">
            <h2 className="font-[var(--font-heading)] text-h2 text-white">Guest checkout (optional)</h2>
            <input
              type="email"
              placeholder="Email for order confirmation"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="form-input mt-3"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-sm font-semibold text-brand-muted">Order total</h2>
            <p className="mt-1 text-3xl font-semibold text-brand-accent">{formatCents(cart.totalCents)}</p>
            <p className="text-caption text-brand-subtle">{cart.totalItems} items</p>
          </div>

          <button
            type="submit"
            disabled={submitting || paymentMethods.length === 0}
            className="btn-primary w-full py-3"
          >
            {submitting ? "Processing..." : "Place order"}
          </button>

          <p className="text-caption text-brand-subtle">
            By placing your order, you confirm production details and agree to the current turnaround and fulfillment terms.
          </p>
        </div>
      </form>
    </section>
  );
}
