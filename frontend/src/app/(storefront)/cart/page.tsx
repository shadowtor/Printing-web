"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCart,
  updateCartLineQuantity,
  removeCartLine,
  type CartLine as CartLineType
} from "../../../services/api/checkout-client";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2
  }).format(cents / 100);
}

export default function CartPage() {
  const [cart, setCart] = useState<{
    lines: CartLineType[];
    totalItems: number;
    totalCents: number;
    currency: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadCart() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart({
        lines: data.lines,
        totalItems: data.totalItems,
        totalCents: data.totalCents,
        currency: data.currency
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function onQuantityChange(lineId: string, newQty: number) {
    if (newQty < 1) return;
    setUpdating(lineId);
    try {
      await updateCartLineQuantity(lineId, newQty);
      await loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  async function onRemove(lineId: string) {
    setUpdating(lineId);
    try {
      await removeCartLine(lineId);
      await loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setUpdating(null);
    }
  }

  if (loading && !cart) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <Link
          href="/"
          className="text-sm font-medium text-slate-300 hover:text-slate-100"
        >
          ← Storefront
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {cart && cart.lines.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center">
          <p className="text-slate-300">Your cart is empty.</p>
          <Link
            href="/quote"
            className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Get a quote and add items
          </Link>
        </div>
      )}

      {cart && cart.lines.length > 0 && (
        <>
          <ul className="space-y-3">
            {cart.lines.map((line) => (
              <li
                key={line.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    Job (quote)
                  </p>
                  <p className="text-xs text-slate-400">
                    Qty × {formatCents(line.lockedUnitPrice)} ={" "}
                    {formatCents(line.lockedUnitPrice * line.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-slate-300">
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v)) onQuantityChange(line.id, v);
                      }}
                      disabled={updating === line.id}
                      className="w-14 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(line.id)}
                    disabled={updating === line.id}
                    className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total ({cart.totalItems} items)</span>
              <span className="font-semibold text-slate-100">
                {formatCents(cart.totalCents)}
              </span>
            </div>
            <Link
              href="/checkout"
              className="mt-4 block w-full rounded bg-emerald-600 py-2 text-center font-medium text-white hover:bg-emerald-500"
            >
              Proceed to checkout
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
