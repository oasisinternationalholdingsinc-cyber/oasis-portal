// app/login/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Step = "CHECKING" | "READY" | "AUTHING" | "ERROR";

function AuthorityShell({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      {/* OS haze */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_-10%,rgba(214,178,94,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(780px_520px_at_50%_120%,rgba(35,65,130,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(560px_420px_at_15%_40%,rgba(255,255,255,0.05),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <div className="mb-10">
          <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
          <div className="mt-1 text-[11px] tracking-[0.18em] text-white/55">
            PORTAL ACCESS • AUTHENTICATION
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_28px_110px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-lg text-white/90">Authority check</div>
              <div className="mt-1 text-sm text-white/70">{label}</div>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.24em] text-white/70">
              AUTHORITY
            </div>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30">
            <div className="h-full w-[45%] animate-pulse bg-[#d6b25e]/25" />
          </div>

          <div className="mt-8 text-xs tracking-[0.18em] text-white/40">
            Oasis International Holdings • Institutional Operating System
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextPath = useMemo(() => {
    const raw = (sp.get("next") || "/client").trim();
    // keep it internal only (prevent open redirects)
    if (!raw.startsWith("/")) return "/client";
    if (raw.startsWith("//")) return "/client";
    return raw;
  }, [sp]);

  // ✅ Cookie-based browser client (required for middleware session)
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [step, setStep] = useState<Step>("CHECKING");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);

  // ✅ Prevent flicker: hold UI in CHECKING until we know if a session exists.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        // small delay smooths “edge says public / client says authed” transitions
        await new Promise((r) => setTimeout(r, 220));
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data.session?.user) {
          router.replace(nextPath);
          return;
        }

        setStep("READY");
      } catch {
        if (!cancelled) setStep("READY");
      }
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) router.replace(nextPath);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase, router, nextPath]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim() || !password) {
      setErr("MISSING_CREDENTIALS");
      return;
    }

    setStep("AUTHING");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErr(error.message || "AUTH_FAILED");
        return;
      }

      // ✅ ensure cookie session is established (middleware reads cookies)
      const { data: after } = await supabase.auth.getSession();
      if (!after.session?.access_token) {
        setErr("SESSION_NOT_ESTABLISHED");
        return;
      }

      router.replace(nextPath);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "UNKNOWN_ERROR");
    } finally {
      // ✅ never freeze
      setStep("READY");
    }
  }

  const disabled = step === "AUTHING";

  if (step === "CHECKING") {
    return <AuthorityShell label="Verifying session state…" />;
  }

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      {/* OS haze */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_-10%,rgba(214,178,94,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(780px_520px_at_50%_120%,rgba(35,65,130,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(560px_420px_at_15%_40%,rgba(255,255,255,0.05),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <div className="mb-10">
          <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
          <div className="mt-1 text-[11px] tracking-[0.18em] text-white/55">
            PORTAL ACCESS • AUTHENTICATION
          </div>
        </div>

        {/* OS-grade surface (no giant black square) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_28px_110px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-2xl font-semibold text-white/90">Sign in</div>
              <div className="mt-2 text-sm text-white/70">
                Authorized access to the internal client console.
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.24em] text-white/70">
              AUTHORITY
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.18em] text-white/55">EMAIL</span>
              <input
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                type="email"
                autoComplete="email"
                className="h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/90 outline-none focus:border-[#d6b25e]/40"
                placeholder="name@domain.com"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs tracking-[0.18em] text-white/55">PASSWORD</span>
              <input
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                type="password"
                autoComplete="current-password"
                className="h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/90 outline-none focus:border-[#d6b25e]/40"
                placeholder="••••••••••"
              />
            </label>

            {err ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
                {err}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={disabled}
              className={[
                "mt-2 h-12 rounded-xl px-5 text-sm tracking-[0.16em] transition",
                "border border-[#d6b25e]/25 bg-[#d6b25e]/10 text-[#f5dea3]",
                "hover:border-[#d6b25e]/40 hover:bg-[#d6b25e]/15",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {disabled ? "AUTHORIZING…" : "SIGN IN"}
            </button>

            <div className="pt-6 text-xs tracking-[0.18em] text-white/35">
              Destination: <span className="text-white/55">{nextPath}</span>
            </div>

            <div className="pt-2 text-xs tracking-[0.18em] text-white/40">
              Oasis International Holdings • Institutional Operating System
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<AuthorityShell label="Loading authentication surface…" />}
    >
      <LoginInner />
    </Suspense>
  );
}
