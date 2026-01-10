"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pw,
      });
      if (error) throw error;

      // ✅ after auth, go to the authenticated client launchpad
      // (middleware will now see the session)
      window.location.href = "/client";
    } catch (e: any) {
      setMsg(e?.message || "Access denied");
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

      setMsg("Secure access link sent.");
    } catch (e: any) {
      setMsg(e?.message || "Unable to send link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* LOCKED SYSTEM VISIBILITY */}
      <div className="space-y-4 opacity-60 lg:col-span-2">
        {["Digital Parliament Ledger", "AXIOM Intelligence", "Client Workspace"].map((t) => (
          <div key={t} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Restricted</div>
            <div className="mt-2 text-xl font-semibold">{t}</div>
            <div className="mt-2 text-sm text-zinc-400">Admission required</div>
          </div>
        ))}
      </div>

      {/* ACCESS WINDOW */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.7)]">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Client Access</div>
        <div className="mt-2 text-2xl font-semibold">Authenticate</div>
        <div className="mt-2 text-sm text-zinc-400">This environment is admission-based.</div>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            placeholder="Password"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
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
            {busy ? "Authenticating…" : "Authenticate"}
          </button>

          <button
            onClick={magicLink}
            disabled={busy}
            className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm"
          >
            Request secure link
          </button>
        </div>
      </div>
    </div>
  );
}
