"use client";

// app/(public)/layout.tsx
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useHeaderEngagement() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setT(clamp((y - 120) / 200, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function NavPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition",
        active
          ? "border-amber-300/30 bg-amber-950/20 text-amber-200 shadow-[0_0_0_1px_rgba(250,204,21,0.10)]"
          : "border-white/10 bg-black/20 text-zinc-400 hover:border-amber-300/25 hover:text-zinc-200 hover:bg-black/30"
      )}
    >
      {label}
    </Link>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const now = useClock();
  const ht = useHeaderEngagement();
  const pathname = usePathname();

  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(
    now.getSeconds()
  )}`;

  const rightLabel = useMemo(() => {
    if (pathname?.startsWith("/login")) return "Authority Surface";
    if (pathname?.startsWith("/client")) return "Private Surface";
    return "Public Authority Gateway";
  }, [pathname]);

  const headerStyle = {
    background: `rgba(2,6,23,${0.35 + ht * 0.45})`,
    borderBottomColor: `rgba(255,255,255,${0.06 + ht * 0.1})`,
    backdropFilter: `blur(${10 + ht * 10}px)`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b" style={headerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-[180px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Oasis OS
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              Digital Parliament Ledger
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <NavPill href="/" label="Gateway" active={pathname === "/"} />
            <NavPill href="/client" label="Client" active={pathname?.startsWith("/client")} />
            <NavPill href="/login" label="Login" active={pathname?.startsWith("/login")} />
          </div>

          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-center">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              System Time
            </div>
            <div className="font-mono text-xs tabular-nums text-zinc-300">
              {clock}
            </div>
          </div>

          <div className="min-w-[180px] text-right text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {rightLabel}
          </div>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs tracking-[0.18em] text-zinc-600">
          Oasis International Holdings • Institutional Operating System
        </div>
      </footer>
    </div>
  );
}
