// app/auth/set-password/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

type Step = "BOOT" | "NO_SESSION" | "READY" | "SAVING" | "DONE" | "ERROR";

async function postJson(url: string, body: unknown, accessToken: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP_${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function SetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const appId = sp.get("app_id"); // may be missing; backend can resolve by email
  const [step, setStep] = useState<Step>("BOOT");
  const [email, setEmail] = useState<string | null>(null);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (step !== "READY") return false;
    if (!pw1 || pw1.length < 10) return false;
    if (pw1 !== pw2) return false;
    return true;
  }, [pw1, pw2, step]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data.session;

        if (!s?.access_token) {
          if (!cancelled) setStep("NO_SESSION");
          return;
        }

        if (!cancelled) {
          setEmail(s.user?.email ?? null);
          setStep("READY");
        }
      } catch {
        if (!cancelled) {
          setStep("ERROR");
          setErr("SESSION_BOOT_FAILED");
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit() {
    setErr(null);
    setOkMsg(null);
    if (!canSubmit) return;

    try {
      setStep("SAVING");

      // 1) Update password under authenticated session
      const { error: updErr } = await supabase.auth.updateUser({ password: pw1 });
      if (updErr) throw new Error(updErr.message);

      // 2) Refresh session token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("MISSING_SESSION_AFTER_PASSWORD_UPDATE");

      // 3) Call provisioning completion Edge Function
      const fnUrl = process.env.NEXT_PUBLIC_PROVISIONING_COMPLETE_URL;
      if (!fnUrl) throw new Error("MISSING_ENV:NEXT_PUBLIC_PROVISIONING_COMPLETE_URL");

      const payload = appId ? { app_id: appId } : { app_id: null };
      await postJson(fnUrl, payload, token);

      setOkMsg("Password set. Provisioning completed.");
      setStep("DONE");

      // ✅ Redirect to internal launchpad
      setTimeout(() => router.replace("/client"), 900);
    } catch (e) {
      setStep("READY");
      setErr(e instanceof Error ? e.message : "UNKNOWN_ERROR");
    }
  }

  return (
    <div className="relative">
      {/* Ambient OS wash (matches /login vibe) */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_12%,rgba(214,178,94,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_50%_88%,rgba(80,140,255,0.07),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
          <div className="mt-1 text-[11px] tracking-[0.18em] text-white/55">
            CREDENTIAL BINDING • SET PASSWORD
          </div>
        </div>

        {step === "NO_SESSION" ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_28px_120px_rgba(0,0,0,0.55)] backdrop-blur">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-2xl font-semibold text-white/90">
                  Session not established
                </div>
                <div className="mt-2 text-sm leading-6 text-white/70">
                  Open the invite link directly from the email (fresh link). If it has
                  expired, request a new invite.
                </div>

                <div className="mt-5 text-xs tracking-[0.18em] text-white/40">
                  {email ? `Detected: ${email}` : "No session user detected."}
                </div>
              </div>

              <div className="mt-1 rounded-full border border-[#d6b25e]/25 bg-[#d6b25e]/10 px-3 py-1 text-[10px] tracking-[0.22em] text-[#f5dea3]">
                AUTHORITY
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                  Gate
                </div>
                <div className="mt-2 text-sm text-white/75">
                  No authenticated invite session is present. This terminal requires a
                  valid session token before binding credentials.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                  Action
                </div>
                <div className="mt-2 text-sm text-white/75">
                  Return to the invite email and open the link again in the same browser.
                </div>
              </div>
            </div>

            <div className="mt-10 text-xs tracking-[0.18em] text-white/35">
              Oasis International Holdings • Institutional Operating System
            </div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
            {/* LEFT: Authority framing */}
            <section className="max-w-xl">
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d6b25e]">
                Oasis OS
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/50">
                Credential Binding • Secure Enrollment
              </div>

              <h1 className="mt-6 text-3xl font-semibold text-white/90">
                Bind your invite session to an operator credential.
              </h1>
              <p className="mt-4 text-sm leading-6 text-white/65">
                This step converts a one-time invite session into a durable credential.
                Minimum 10 characters. Provisioning is completed immediately after a
                successful password set.
              </p>

              <div className="mt-8 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                    Session
                  </div>
                  <div className="mt-2 text-sm text-white/75">
                    {email ? (
                      <>
                        <span className="text-white/55">Detected:</span>{" "}
                        <span className="font-mono text-xs text-white/85">{email}</span>
                      </>
                    ) : (
                      <span className="text-white/60">Detecting…</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                    Application
                  </div>
                  <div className="mt-2 text-sm text-white/75">
                    <span className="font-mono text-xs text-white/85">
                      {appId ? appId : "auto-resolve (email)"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: Set-password card */}
            <section className="lg:pt-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_28px_120px_rgba(0,0,0,0.55)] backdrop-blur">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-2xl font-semibold text-white/90">
                      Set password
                    </div>
                    <div className="mt-1 text-sm text-white/65">
                      Minimum 10 characters. Must match confirmation.
                    </div>
                  </div>

                  <div className="rounded-full border border-[#d6b25e]/25 bg-[#d6b25e]/10 px-3 py-1 text-[10px] tracking-[0.22em] text-[#f5dea3]">
                    AUTHORITY
                  </div>
                </div>

                <div className="mt-7 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-xs tracking-[0.18em] text-white/55">
                      NEW PASSWORD
                    </span>
                    <input
                      type="password"
                      value={pw1}
                      onChange={(e) => setPw1(e.target.value)}
                      className="h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/90 outline-none focus:border-[#d6b25e]/40"
                      placeholder="••••••••••"
                      autoComplete="new-password"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs tracking-[0.18em] text-white/55">
                      CONFIRM PASSWORD
                    </span>
                    <input
                      type="password"
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      className="h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/90 outline-none focus:border-[#d6b25e]/40"
                      placeholder="••••••••••"
                      autoComplete="new-password"
                    />
                  </label>

                  {err ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
                      {err}
                    </div>
                  ) : null}

                  {okMsg ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
                      {okMsg}
                    </div>
                  ) : null}

                  <button
                    onClick={onSubmit}
                    disabled={!canSubmit || step === "SAVING" || step === "DONE"}
                    className={[
                      "mt-1 h-12 rounded-xl px-5 text-sm font-semibold tracking-[0.14em] transition",
                      "border border-[#d6b25e]/25 bg-[#d6b25e]/10 text-[#f5dea3]",
                      "hover:border-[#d6b25e]/40 hover:bg-[#d6b25e]/15",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    ].join(" ")}
                  >
                    {step === "SAVING"
                      ? "SEALING…"
                      : step === "DONE"
                        ? "PROVISIONED"
                        : "SET PASSWORD"}
                  </button>

                  <div className="pt-2 text-xs tracking-[0.18em] text-white/35">
                    Destination: <span className="text-white/55">/client</span>
                  </div>

                  <div className="pt-1 text-xs tracking-[0.18em] text-white/40">
                    Oasis International Holdings • Institutional Operating System
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070d] text-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Loading secure session…
            </div>
          </div>
        </div>
      }
    >
      <SetPasswordInner />
    </Suspense>
  );
}
