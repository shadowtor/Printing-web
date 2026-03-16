import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Playground.au",
  description: "3D printing storefront and management"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-widest text-emerald-400">
                PLAYGROUND.AU
              </span>
              <span className="text-xs text-slate-400">
                Home 3D printing storefront & management
              </span>
            </div>
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <a href="/" className="hover:text-emerald-400">
                Storefront
              </a>
              <a href="/quote" className="hover:text-emerald-400">
                Instant quote
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

