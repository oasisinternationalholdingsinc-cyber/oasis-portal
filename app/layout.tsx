"use client";

import "./globals.css";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

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

function useFooterEngagement() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const dist =
        Math.max(doc.scrollHeight, doc.offsetHeight) -
        ((window.scrollY || doc.scrollTop) + window.innerHeight);
      setT(clamp((520 - dist) / 380, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

export default function OasisOSLayout({ children }: { children: React.ReactNode }) {
  const now = useClock();
  const ht = useHeaderEngagement();
  const ft = useFooterEngagement();

  const clock = `${pad2(now.getHours())}:${pad2(
    now.getMinutes()
  )}:${pad2(now.getSeconds())}`;

  const headerStyle = {
    background: `rgba(2,6,23,${0.35 + ht * 0.45})`,
    borderBottomColor: `rgba(255,255,255,${0.06 + ht * 0.1})`,
    backdropFilter: `blur(${10 + ht * 10}px)`,
  } as React.CSSProperties;

  const footerStyle = {
    background: `rgba(2,6,23,${0.25 + ft * 0.5})`,
    borderTopColor: `rgba(255,255,255,${0.05 + ft * 0.12})`,
    backdropFilter: `blur(${8 + ft * 12}px)`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      {/* HEADER */}
      <div className="sticky top-0 z-50 border-b" style={headerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Oasis OS
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              Digital Parliament Ledger
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-center">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              System Time
            </div>
            <div className="font-mono text-xs tabular-nums text-zinc-300">
              {clock}
            </div>
          </div>

          <div className="text-right text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Authority Surface
          </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>

      {/* FOOTER */}
      <div className="sticky bottom-0 border-t" style={footerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-zinc-500">
          Oasis International Holdings • Institutional Operating System
        </div>
      </div>
    </div>
  );
}
