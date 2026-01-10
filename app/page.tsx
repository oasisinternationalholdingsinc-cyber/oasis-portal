"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

// ===== Main (CONTENT ONLY — NO HEADER/FOOTER; layout.tsx owns OS chrome) =====
export default function LoginLockedOS() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      setMsg(e?.message || "Access denied.");
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
      setMsg(e?.message || "Unable to send link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Locked OS Tiles */}
      <div className="lg:col-span-2 space-y-4 opacity-60">
        {["Digital Parliament Ledger", "AXIOM Intelligence", "Client Workspace"].map((t) => (
          <div key={t} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Restricted</div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">{t}</div>
            <div className="mt-2 text-sm text-zinc-400">Admission required</div>
          </div>
        ))}
      </div>

      {/* Access Window */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.7)]">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Client Access</div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">Authenticate</div>
        <div className="mt-2 text-sm text-zinc-400">This environment is admission-based.</div>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
            placeholder="Password"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
          />

          {msg && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
              {msg}
            </div>
          )}

          <button
            onClick={signIn}
            disabled={busy}
            className={[
              "w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
              busy
                ? "cursor-not-allowed border border-white/10 bg-zinc-900/40 text-zinc-400"
                : "bg-amber-300 text-black hover:bg-amber-200",
            ].join(" ")}
          >
            {busy ? "Entering…" : "Enter"}
          </button>

          <button
            onClick={magicLink}
            disabled={busy}
            className={[
              "w-full rounded-xl border px-4 py-3 text-sm transition",
              busy
                ? "cursor-not-allowed border-white/10 bg-zinc-900/30 text-zinc-500"
                : "border-white/10 bg-transparent text-zinc-100 hover:bg-white/5",
            ].join(" ")}
          >
            Email Secure Link
          </button>
        </div>
      </div>
    </div>
  );
}
