"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// ===== Utilities =====
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ===== Clock =====
function useClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ===== Header engagement =====
function useHeaderEngagement() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const raw = (y - 140) / 180;
      setT(clamp(raw, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

// ===== Footer engagement =====
function useFooterEngagement() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const dist =
        Math.max(doc.scrollHeight, doc.offsetHeight) -
        ((window.scrollY || doc.scrollTop) + window.innerHeight);
      const raw = (520 - dist) / 380;
      setT(clamp(raw, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

// ===== Main =====
export default function LoginLockedOS() {
  const now = useClock();
  const ht = useHeaderEngagement();
  const ft = useFooterEngagement();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const clock = useMemo(
    () =>
      `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(
        now.getSeconds()
      )}`,
    [now]
  );

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

  // ===== Auth =====
  async function signIn() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pw,
      });
      if (error) throw error;
      window.location.href = "/";
    } catch (e: any) {
      setMsg(e.message || "Access denied.");
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMsg("Secure link sent.");
    } catch (e: any) {
      setMsg(e.message || "Unable to send link.");
    } finally {
      setBusy(false);
    }
  }

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
              Client Access • Restricted
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
        </div>
      </div>

      {/* BODY */}
      <main className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Locked OS Tiles */}
        <div className="lg:col-span-2 space-y-4 opacity-60">
          {["Digital Parliament Ledger", "AXIOM Intelligence", "Client Workspace"].map(
            (t) => (
              <div
                key={t}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6"
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  Restricted
                </div>
                <div className="mt-2 text-xl font-semibold">{t}</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Admission required
                </div>
              </div>
            )
          )}
        </div>

        {/* ACCESS WINDOW */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.7)]">
          <div className="text-[11px] uppercase tracking-[0.22em] text-amber-300">
            Client Access
          </div>
          <div className="mt-2 text-2xl font-semibold">Authenticate</div>
          <div className="mt-2 text-sm text-zinc-400">
            This environment is admission-based.
          </div>

          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              placeholder="Password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />

            {msg && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {msg}
              </div>
            )}

            <button
              onClick={signIn}
              disabled={busy}
              className="w-full rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-black"
            >
              Enter
            </button>

            <button
              onClick={magicLink}
              disabled={busy}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm"
            >
              Email Secure Link
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <div className="sticky bottom-0 border-t" style={footerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-zinc-500">
          Oasis International Holdings • Institutional Operating System
        </div>
      </div>
    </div>
  );
}
