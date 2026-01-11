// app/login/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function LoginPage() {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);

  const [booting, setBooting] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const { data } = await sb.auth.getSession();
        if (data.session?.access_token) {
          router.replace("/client");
          return;
        }
      } finally {
        if (mounted) setBooting(false);
      }
    }

    boot();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.access_token) router.replace("/client");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sb, router]);

  async function onLogin() {
    setErr(null);
    setBusy(true);

    try {
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      router.replace("/client");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "LOGIN_FAILED");
      setBusy(false);
    }
  }

  if (booting) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
        <div className="mt-1 text-[11px] tracking-[0.18em] text-white/55">
          PORTAL ACCESS • AUTHENTICATION
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          Loading secure session…
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
      <div className="mt-1 text-[11px] tracking-[0.18em] text-white/55">
        PORTAL ACCESS • AUTHENTICATION
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-7">
        <div className="text-xl font-semibold text-white/90">Sign in</div>
        <div className="mt-2 text-sm text-white/70">
          Authorized access to the internal client console.
        </div>

        <div className="mt-7 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.18em] text-white/55">EMAIL</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/90 outline-none focus:border-[#d6b25e]/40"
              placeholder="name@domain.com"
              autoComplete="email"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs tracking-[0.18em] text-white/55">PASSWORD</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/90 outline-none focus:border-[#d6b25e]/40"
              placeholder="••••••••••"
              autoComplete="current-password"
            />
          </label>

          {err ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
              {err}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onLogin}
            disabled={busy || !email.trim() || !password}
            className={cx(
              "mt-2 h-11 rounded-xl px-5 text-sm tracking-[0.16em] transition",
              "border border-[#d6b25e]/25 bg-[#d6b25e]/10 text-[#f5dea3]",
              "hover:border-[#d6b25e]/40 hover:bg-[#d6b25e]/15",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {busy ? "AUTHORIZING…" : "SIGN IN"}
          </button>

          <div className="mt-8 text-xs tracking-[0.18em] text-white/40">
            Oasis International Holdings • Institutional Operating System
          </div>
        </div>
      </div>
    </main>
  );
}
