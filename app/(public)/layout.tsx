// app/(public)/layout.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";

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
      setT(clamp((y - 50) / 240, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const now = useClock();
  const ht = useHeaderEngagement();

  const clock = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(
    now.getUTCSeconds()
  )} UTC`;

  const headerStyle = {
    background: `rgba(2,6,23,${0.18 + ht * 0.58})`,
    borderBottomColor: `rgba(255,255,255,${0.05 + ht * 0.12})`,
    backdropFilter: `blur(${14 + ht * 14}px)`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen text-zinc-100">
      {/* Deep OS field */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#071730_0%,_#020617_46%,_#000_100%)]"
      />
      {/* Gold veil */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(920px 520px at 50% -10%, rgba(250,204,21,0.11), transparent 58%)",
        }}
      />
      {/* Corner glows */}
      <div
        aria-hidden
        className="fixed -z-10 left-[-180px] top-[90px] h-[560px] w-[560px] rounded-full bg-sky-400/10 blur-[90px]"
      />
      <div
        aria-hidden
        className="fixed -z-10 right-[-220px] top-[140px] h-[640px] w-[640px] rounded-full bg-indigo-400/10 blur-[110px]"
      />

      {/* Sticky control-plane */}
      <header className="sticky top-0 z-50 border-b" style={headerStyle}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Oasis OS
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              Public Authority Gateway
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 shadow-[0_14px_50px_rgba(0,0,0,0.55)]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                System Time
              </div>
              <div className="font-mono text-xs tabular-nums text-zinc-300">
                {clock}
              </div>
            </div>
            <div className="rounded-full border border-amber-300/18 bg-amber-950/10 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-amber-200">
              Gateway
            </div>
          </div>

          <div className="text-right text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            No execution
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>

      {/* Dormant footer rail */}
      <footer className="mt-10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-zinc-500">
          <div className="tracking-[0.18em] uppercase">Oasis International Holdings</div>
          <div className="hidden sm:block text-[11px] text-zinc-600">
            Sovereign terminals: Sign / Verify / Certificate
          </div>
          <div className="tracking-[0.18em] uppercase text-zinc-600">
            Evidence over claims
          </div>
        </div>
      </footer>
    </div>
  );
}
