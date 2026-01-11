"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const now = useClock();

  const code = sp.get("code");
  const appId = sp.get("app_id");

  const error = sp.get("error");
  const errorCode = sp.get("error_code");
  const errorDescription = sp.get("error_description");

  const [status, setStatus] = useState<
    "INIT" | "EXCHANGING" | "SESSION_OK" | "NO_SESSION" | "ERROR"
  >("INIT");

  const detail = useMemo(() => {
    if (error || errorCode || errorDescription) {
      return `${error ?? "error"}${errorCode ? ` (${errorCode})` : ""}${
        errorDescription ? ` — ${errorDescription}` : ""
      }`;
    }
    return null;
  }, [error, errorCode, errorDescription]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("EXCHANGING");

        // 1) If Supabase provided a PKCE code, exchange it for a session.
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            if (!cancelled) setStatus("ERROR");
            return;
          }
        }

        // 2) Confirm session exists.
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data.session?.access_token;

        if (!hasSession) {
          if (!cancelled) setStatus("NO_SESSION");
          return;
        }

        if (!cancelled) setStatus("SESSION_OK");

        // 3) Route into set-password (keep app_id if present)
        const dest = appId ? `/auth/set-password?app_id=${encodeURIComponent(appId)}` : `/auth/set-password`;
        router.replace(dest);
      } catch {
        if (!cancelled) setStatus("ERROR");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code, appId, router]);

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-b from-black/40 to-transparent backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-xs tracking-[0.28em] text-[#d6b25e]">OASIS OS</div>
            <div className="text-[11px] tracking-[0.18em] text-white/55">
              PUBLIC AUTHORITY GATEWAY
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-[0.24em] text-white/70">
            SYSTEM TIME <span className="ml-2 text-white/85">{fmtTime(now)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-4 text-sm tracking-[0.22em] text-white/60">AUTH CALLBACK</div>

        {detail ? (
          <>
            <div className="mb-3 text-lg text-white/90">Authorization failed</div>
            <div className="max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200/90">
              {detail}
            </div>
            <div className="mt-6 text-sm text-white/60">
              This usually means your Supabase <span className="text-white/85">Site URL</span> or{" "}
              <span className="text-white/85">Allowed Redirect URLs</span> do not match the deployed domain.
            </div>
          </>
        ) : status === "NO_SESSION" ? (
          <>
            <div className="mb-3 text-lg text-white/90">Missing session token</div>
            <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
              Please open the invite link directly from the email (fresh link), and ensure the redirect domain is
              allowed in Supabase Auth settings.
            </div>
          </>
        ) : status === "ERROR" ? (
          <>
            <div className="mb-3 text-lg text-white/90">Callback error</div>
            <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
              An unexpected error occurred while establishing the session.
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 text-lg text-white/90">Establishing secure session…</div>
            <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
              Please wait. You will be redirected automatically.
            </div>
          </>
        )}

        <div className="mt-14 text-xs tracking-[0.18em] text-white/40">
          Oasis International Holdings • Institutional Operating System
        </div>
      </div>
    </div>
  );
}
