// app/login/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Step = "READY" | "AUTHING";

function LoginInner() {
  const sp = useSearchParams();

  const nextPath = useMemo(() => {
    const raw = (sp.get("next") || "/client").trim();
    // prevent open redirects
    if (!raw.startsWith("/")) return "/client";
    if (raw.startsWith("//")) return "/client";
    return raw;
  }, [sp]);

  const [step, setStep] = useState<Step>("READY");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [sessionDetected, setSessionDetected] = useState(false);

  const disabled = step === "AUTHING";

  // ✅ Cookie-truth session check (NO supabase browser session — avoids localStorage “phantom session”)
  // If cookies already authorize, we’ll see a non-redirect response.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const r = await fetch(nextPath, {
          method: "GET",
          credentials: "include",
          redirect: "manual",
          cache: "no-store",
        });

        if (cancelled) return;

        // If middleware redirects, browsers often return 307/302 here (manual redirect).
        // If authorized, we’ll get 200-ish.
        if (r.status >= 200 && r.status < 300) setSessionDetected(true);
        else setSessionDetected(false);
      } catch {
        if (!cancelled) setSessionDetected(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  function go(to: string) {
    // ✅ Hard navigation ensures middleware runs with fresh cookies
    window.location.assign(to);
  }

  async function onContinue() {
    setErr(null);
    setStep("AUTHING");
    try {
      go(nextPath);
    } finally {
      // If navigation is blocked by browser for any reason, don’t freeze UI
      setTimeout(() => setStep("READY"), 400);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim() || !password) {
      setErr("MISSING_CREDENTIALS");
      return;
    }

    setStep("AUTHING");

    try {
      const r = await fetch("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        setErr(j?.details || j?.error || "AUTH_FAILED");
        return;
      }

      // ✅ Cookies now exist → middleware will allow /client
      go(nextPath);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "UNKNOWN_ERROR");
    } finally {
      setTimeout(() => setStep("READY"), 350);
    }
  }

  return (
    <div className="relative">
      {/* Subtle authority glow inside OS workspace (NO full-screen takeover) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-8 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-10 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 py-10 lg:grid-cols-2 lg:gap-14">
        {/* LEFT: Authority framing */}
        <section className="max-w-xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
            Oasis OS
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            Portal Access • Authentication
          </div>

          <h1 className="mt-6 text-3xl font-semibold text-zinc-100">
            Secure entry to the private client launchpad.
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            This surface establishes a cookie-truth session for institutional access. No
            signing occurs here. Verification and certificates remain terminal-bound.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Gate
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                Session authority is enforced by middleware. This terminal only
                establishes credentials.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Destination
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                <span className="font-mono text-xs tabular-nums text-zinc-200">
                  {nextPath}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: Auth card */}
        <section className="lg:pt-2">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-7 shadow-[0_28px_120px_rgba(0,0,0,0.55)] backdrop-blur">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-2xl font-semibold text-zinc-100">Sign in</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Authorized access to the internal client console.
                </div>
              </div>

              <div className="rounded-full border border-amber-300/25 bg-amber-950/10 px-3 py-1 text-[10px] tracking-[0.22em] text-amber-200">
                AUTHORITY
              </div>
            </div>

            {/* Session Detected (cookie-truth) */}
            {sessionDetected ? (
              <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-950/10 px-5 py-4">
                <div className="text-[11px] tracking-[0.22em] text-amber-200">
                  SESSION DETECTED
                </div>
                <div className="mt-1 text-sm text-zinc-300">
                  You’re already authenticated. Continue to your destination.
                </div>

                <button
                  type="button"
                  onClick={onContinue}
                  disabled={disabled}
                  className={[
                    "mt-4 h-11 w-full rounded-xl px-5 text-sm font-semibold tracking-[0.14em] transition",
                    "border border-amber-300/25 bg-amber-300 text-black",
                    "hover:bg-amber-200",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  ].join(" ")}
                >
                  {disabled ? "AUTHORIZING…" : "CONTINUE"}
                </button>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-7 grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.18em] text-zinc-400">EMAIL</span>
                <input
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  type="email"
                  autoComplete="email"
                  className="h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300/40"
                  placeholder="name@domain.com"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs tracking-[0.18em] text-zinc-400">
                  PASSWORD
                </span>
                <input
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300/40"
                  placeholder="••••••••••"
                />
              </label>

              {err ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
                  {err}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={disabled}
                className={[
                  "mt-1 h-12 rounded-xl px-5 text-sm font-semibold tracking-[0.14em] transition",
                  "border border-amber-300/25 bg-amber-300 text-black",
                  "hover:bg-amber-200",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                {disabled ? "AUTHORIZING…" : "SIGN IN"}
              </button>

              <div className="pt-3 text-xs tracking-[0.18em] text-zinc-500">
                Destination:{" "}
                <span className="font-mono text-[11px] tabular-nums text-zinc-300">
                  {nextPath}
                </span>
              </div>

              <div className="pt-1 text-xs tracking-[0.18em] text-zinc-600">
                Oasis International Holdings • Institutional Operating System
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Oasis OS
            </div>
            <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
              Loading authentication surface…
            </div>
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
