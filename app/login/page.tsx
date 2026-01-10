"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const shell = useMemo(
    () => ({
      background: "rgba(2, 6, 23, 0.72)",
      borderColor: "rgba(255,255,255,0.10)",
      backdropFilter: "blur(16px)",
    }),
    []
  );

  const gold = "rgba(255, 214, 128, 0.90)";

  const signIn = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const e = email.trim().toLowerCase();
      if (!e) return setMsg("Enter your email.");

      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password: pw,
      });
      if (error) throw error;

      window.location.href = "/"; // middleware will allow now
    } catch (err: any) {
      setMsg(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const magicLink = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const e = email.trim().toLowerCase();
      if (!e) return setMsg("Enter your email.");

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          // IMPORTANT: keep this pointed at your portal callback
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      setMsg("Magic link sent. Check your email.");
    } catch (err: any) {
      setMsg(err?.message || "Could not send link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] px-6 py-10">
      <div className="mx-auto max-w-xl">
        <div
          className="rounded-3xl border shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
          style={shell}
        >
          <div className="p-8 sm:p-10">
            <div className="text-[11px] tracking-[.18em] uppercase" style={{ color: gold }}>
              Oasis Portal
            </div>
            <div className="mt-2 text-2xl font-semibold text-white/90">
              Client Sign In
            </div>
            <div className="mt-2 text-sm leading-7 text-white/60">
              This portal is private and admission-based. If you don’t have access,
              start onboarding on the admissions surface.
            </div>

            <div className="mt-8 space-y-3">
              <label className="block">
                <div className="text-xs text-white/60">Email</div>
                <input
                  className={cx(
                    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                    "bg-white/5 border-white/10 text-white/90",
                    "focus:border-[rgba(255,214,128,0.35)]"
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <div className="text-xs text-white/60">Password</div>
                <input
                  className={cx(
                    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                    "bg-white/5 border-white/10 text-white/90",
                    "focus:border-[rgba(255,214,128,0.35)]"
                  )}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                />
              </label>

              {msg && (
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  {msg}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={signIn}
                  disabled={busy}
                  className={cx(
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    "bg-white/10 text-white/90 border border-white/10",
                    "hover:bg-white/15 disabled:opacity-60"
                  )}
                >
                  Sign in
                </button>

                <button
                  onClick={magicLink}
                  disabled={busy}
                  className={cx(
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    "bg-transparent text-white/80 border border-white/10",
                    "hover:bg-white/5 disabled:opacity-60"
                  )}
                >
                  Email me a link
                </button>
              </div>

              <div className="mt-6 text-xs text-white/45">
                Need access? Use the Onboarding intake. Authority actions are handled in Console.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-white/40">
          Oasis International Holdings • Private Client Surface
        </div>
      </div>
    </div>
  );
}
