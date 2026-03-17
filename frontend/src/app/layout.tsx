import type { ReactNode } from "react";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Logo } from "../components/logo";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata = {
  title: "PLAground.au",
  description: "3D printing storefront and management"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} min-h-screen font-[var(--font-body)] text-brand-text`}>
        <header className="sticky top-0 z-30 border-b border-brand-border/60 bg-brand-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <Logo size="sm" showWordmark />
              <div className="hidden flex-col md:flex">
                <span className="font-[var(--font-heading)] text-caption uppercase tracking-[0.2em] text-brand-muted">
                  Printing commerce platform
                </span>
                <span className="text-xs text-brand-subtle">Quote, checkout, account, and operations</span>
              </div>
            </Link>
            <nav className="flex flex-wrap items-center gap-2 rounded-full border border-brand-border bg-brand-surfaceSoft/80 px-2 py-1 text-sm text-brand-muted shadow-soft-inner">
              <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-brand-primary/20 hover:text-brand-text">
                Storefront
              </Link>
              <Link href="/quote" className="rounded-full px-3 py-1.5 hover:bg-brand-primary/20 hover:text-brand-text">
                Instant quote
              </Link>
              <Link href="/cart" className="rounded-full px-3 py-1.5 hover:bg-brand-primary/20 hover:text-brand-text">
                Cart
              </Link>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-brand-primary/20 hover:text-brand-text">
                Sign in
              </Link>
              <Link href="/orders" className="rounded-full px-3 py-1.5 hover:bg-brand-primary/20 hover:text-brand-text">
                My orders
              </Link>
              <Link href="/admin" className="rounded-full bg-brand-primary px-3 py-1.5 font-semibold text-white hover:brightness-110">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <div className="pointer-events-none fixed inset-0 -z-10 brand-grid-bg" />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="space-y-6">{children}</div>
        </main>
      </body>
    </html>
  );
}

