// app/(public)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

export const dynamic = "force-static";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-100 antialiased">
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_60%)]" />
        </div>

        {/* Top control bar */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link
              href="/"
              className="text-sm font-semibold tracking-wide text-zinc-100 hover:text-white"
            >
              Oasis International Holdings
            </Link>

            <nav className="flex items-center gap-6 text-xs tracking-wide text-zinc-400">
              <Link href="/" className="hover:text-white transition">
                Home
              </Link>
              <Link href="/apply" className="hover:text-white transition">
                Apply
              </Link>
              <a
                href="https://portal.oasisintlholdings.com"
                className="rounded-full border border-amber-400/40 px-4 py-1.5 text-amber-300 transition hover:border-amber-400 hover:bg-amber-400/10"
              >
                Public Authority Gateway
              </a>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-6 py-16">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} Oasis International Holdings</span>
            <span className="tracking-wide">Public Institutional Surface</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
