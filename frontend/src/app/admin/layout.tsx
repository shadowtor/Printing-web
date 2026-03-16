"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAdminToken, clearAdminToken } from "../../services/api/admin-client";

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
    return <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>;
  }
  if (!token) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-slate-400">Redirecting…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-200">Admin</h1>
          <nav className="flex flex-wrap gap-2">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded px-2 py-1 text-sm ${
                  pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"))
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-emerald-400"
          >
            Storefront
          </Link>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
            className="rounded border border-slate-600 px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </main>
  );
}
