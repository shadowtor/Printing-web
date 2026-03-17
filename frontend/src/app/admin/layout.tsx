"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAdminToken, clearAdminToken } from "../../services/api/admin-client";
import { Logo } from "../../components/logo";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/queues", label: "Queues" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/ops", label: "Ops" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const token = typeof window !== "undefined" ? getAdminToken() : null;

  useEffect(() => {
    if (isLoginPage) return;
    if (!token) router.replace("/admin/login");
  }, [token, isLoginPage, router]);

  if (isLoginPage) {
    return <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>;
  }
  if (!token) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-brand-muted">Redirecting…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="panel h-fit p-3">
          <div className="mb-4 border-b border-brand-border pb-3">
            <Logo size="md" />
            <p className="mt-2 text-caption uppercase tracking-[0.18em] text-brand-subtle">
              Operations
            </p>
          </div>
          <nav className="space-y-1.5">
            {nav.map(({ href, label }) => {
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand-primary text-white shadow-glow"
                      : "text-brand-muted hover:bg-brand-surfaceSoft hover:text-brand-text"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-brand-border pt-4">
            <Link href="/" className="btn-secondary w-full justify-center">
              Storefront
            </Link>
            <button
              type="button"
              onClick={() => {
                clearAdminToken();
                router.replace("/admin/login");
              }}
              className="mt-2 w-full rounded-lg border border-brand-danger/40 bg-brand-danger/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-brand-danger/20"
            >
              Sign out
            </button>
          </div>
        </aside>
        <section className="space-y-6">
          <header className="panel flex items-center justify-between p-4">
            <div>
              <p className="text-caption uppercase tracking-[0.16em] text-brand-subtle">Admin panel</p>
              <h1 className="font-[var(--font-heading)] text-h2 text-white">Production command center</h1>
            </div>
            <span className="rounded-full border border-brand-primary/50 bg-brand-primary/10 px-3 py-1 text-caption text-brand-muted">
              Live
            </span>
          </header>
          <div>{children}</div>
        </section>
      </div>
    </main>
  );
}
