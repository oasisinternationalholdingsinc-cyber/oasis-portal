"use client";

import "../globals.css";
import type React from "react";
import { useEffect, useState } from "react";

/* ---------------- helpers ---------------- */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useClockUTC() {
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
      setT(clamp((y - 80) / 180, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

/* ---------------- layout ---------------- */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = useClockUTC();
  const ht = useHeaderEngagement();

  const clock = `${pad2(now.getUTCHours())}:${pad2(
    now.getUTCMinutes()
  )}:${pad2(now.getUTCSeconds())} UTC`;

  const headerStyle: React.CSSProperties = {
    background: `rgba(2,6,23,${0.32 + ht * 0.45})`,
    borderBottomColor: `rgba(255,255,255,${0.06 + ht * 0.12})`,
    backdropFilter: `blur(${10 + ht * 12}px)`,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      {/* ================= HEADER ================= */}
      <header
        className="sticky top-0 z-50 border-b transition-colors"
        style={headerStyle}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          {/* LEFT */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Oasis OS
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              Public Authority Gateway
            </div>
          </div>

          {/* CENTER CLOCK */}
          <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-500 text-center">
              System Time
            </div>
            <div className="font-mono text-xs tabular-nums text-zinc-300 text-center">
              {clock}
            </div>
          </div>

          {/* RIGHT */}
          <div className="text-right">
            <div className="rounded-full border border-amber-300/20 bg-amber-950/10 px-3 py-1 text-[10px] tracking-[0.22em] text-amber-200">
              PUBLIC SURFACE
            </div>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE ================= */}
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-5 text-center text-xs tracking-[0.18em] text-zinc-500">
          Oasis International Holdings • Institutional Operating System
        </div>
      </footer>
    </div>
  );
}
