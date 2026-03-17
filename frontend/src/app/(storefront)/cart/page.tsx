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
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Cart</h1>
        <p className="text-body text-brand-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Cart</h1>
        <Link
          href="/"
          className="btn-secondary"
        >
          ← Storefront
        </Link>
      </div>

      {error && (
        <div className="rounded-panel border border-brand-danger/40 bg-brand-danger/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {cart && cart.lines.length === 0 && (
        <div className="panel p-6 text-center">
          <p className="text-body text-brand-muted">Your cart is empty.</p>
          <Link
            href="/quote"
            className="btn-primary mt-3"
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
                className="panel-soft flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text">
                    Job (quote)
                  </p>
                  <p className="text-caption text-brand-subtle">
                    Qty × {formatCents(line.lockedUnitPrice)} ={" "}
                    {formatCents(line.lockedUnitPrice * line.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-brand-muted">
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
                      className="form-input w-16"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(line.id)}
                    disabled={updating === line.id}
                    className="rounded-md border border-brand-border bg-brand-bg/60 px-3 py-1.5 text-caption text-brand-muted hover:text-brand-text disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="panel p-4">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Total ({cart.totalItems} items)</span>
              <span className="font-semibold text-brand-accent">
                {formatCents(cart.totalCents)}
              </span>
            </div>
            <Link
              href="/checkout"
              className="btn-primary mt-4 flex w-full justify-center"
            >
              Proceed to checkout
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
