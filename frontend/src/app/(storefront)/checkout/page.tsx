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
        const [cartData, methods] = await Promise.all([
          getCart(),
          getPaymentMethods()
        ]);
        setCart({
          totalCents: cartData.totalCents,
          totalItems: cartData.totalItems,
          lines: cartData.lines
        });
        setPaymentMethods(methods);
        if (methods.length > 0 && !selectedMethod) {
          setSelectedMethod(methods[0].method);
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
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        {error ? (
          <p className="text-amber-200">{error}</p>
        ) : (
          <p className="text-slate-400">Loading…</p>
        )}
      </section>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-slate-300">Your cart is empty.</p>
        <Link
          href="/cart"
          className="inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          View cart
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <Link
          href="/cart"
          className="text-sm font-medium text-slate-300 hover:text-slate-100"
        >
          ← Cart
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-medium text-slate-200">Order total</h2>
          <p className="mt-1 text-xl font-semibold text-slate-100">
            {formatCents(cart.totalCents)}
          </p>
          <p className="text-xs text-slate-400">{cart.totalItems} items</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-200">
            Payment method
          </h2>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <label
                key={m.method}
                className="flex cursor-pointer items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-3 py-2 hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.method}
                  checked={selectedMethod === m.method}
                  onChange={() => setSelectedMethod(m.method)}
                  className="text-emerald-500"
                />
                <span className="capitalize text-slate-200">{m.method}</span>
              </label>
            ))}
          </div>
          {paymentMethods.length === 0 && (
            <p className="text-sm text-slate-400">
              No payment methods configured. Contact support.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-200">
            Guest checkout (optional)
          </h2>
          <input
            type="email"
            placeholder="Email for order confirmation"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || paymentMethods.length === 0}
          className="w-full rounded bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Processing…" : "Place order"}
        </button>
      </form>
    </section>
  );
}
