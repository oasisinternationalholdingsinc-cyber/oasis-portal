"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useRailEngagement() {
  const [t, setT] = useState(0); // 0..1
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const viewportH = window.innerHeight || 0;
      const docH = Math.max(doc.scrollHeight, doc.offsetHeight);
      const dist = docH - (scrollTop + viewportH);

      const start = 520;
      const end = 140;
      const raw = (start - dist) / (start - end);
      setT(clamp(raw, 0, 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

function parseErrorFromUrl() {
  const url = new URL(window.location.href);
  const q = {
    error: url.searchParams.get("error"),
    error_code: url.searchParams.get("error_code"),
    error_description: url.searchParams.get("error_description"),
    type: url.searchParams.get("type"),
  };

  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";
  const hs = new URLSearchParams(hash);

  const h = {
    error: hs.get("error"),
    error_code: hs.get("error_code"),
    error_description: hs.get("error_description"),
    type: hs.get("type"),
  };

  return {
    error: q.error || h.error,
    error_code: q.error_code || h.error_code,
    error_description: q.error_description || h.error_description,
    type: q.type || h.type,
  };
}

/**
 * Reads application context from URL.
 * Supports:
 *  - ?app_id=...
 *  - #app_id=...
 *  - ?application_id=...  (defensive)
 *  - #application_id=...  (defensive)
 */
function readAppIdFromUrl(): string | null {
  const url = new URL(window.location.href);

  const q = url.searchParams.get("app_id") || url.searchParams.get("application_id") || "";
  if (q && q.trim()) return q.trim();

  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";
  const hs = new URLSearchParams(hash);

  const h = hs.get("app_id") || hs.get("application_id") || "";
  if (h && h.trim()) return h.trim();

  return null;
}

function isUuidLike(x: string) {
  const s = (x || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

type AppIdSource = "query" | "hash" | "cached" | "resolved" | "none";

function readAppIdFromUrlWithSource(): { appId: string | null; source: AppIdSource } {
  const url = new URL(window.location.href);

  const q = url.searchParams.get("app_id") || url.searchParams.get("application_id");
  if (q && q.trim()) return { appId: q.trim(), source: "query" };

  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";
  const hs = new URLSearchParams(hash);

  const h = hs.get("app_id") || hs.get("application_id");
  if (h && h.trim()) return { appId: h.trim(), source: "hash" };

  return { appId: null, source: "none" };
}

async function getAccessTokenOrNull(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session?.access_token ?? null;
}

async function callProvisioningEdge(
  token: string,
  appId: string | null
): Promise<{ ok: boolean; app_id?: string; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${base}/functions/v1/admissions-complete-provisioning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ app_id: appId }),
  });

  let j: any = null;
  try {
    j = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    return { ok: false, error: j?.error || `HTTP_${res.status}` };
  }
  return { ok: !!j?.ok, app_id: j?.app_id, error: j?.error };
}

export default function SetPasswordPage() {
  const now = useClock();
  const railT = useRailEngagement();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [urlErr, setUrlErr] = useState<{
    error?: string | null;
    error_code?: string | null;
    error_description?: string | null;
    type?: string | null;
  } | null>(null);

  // app context (badge-critical)
  const [appId, setAppId] = useState<string | null>(null);
  const [appIdSource, setAppIdSource] = useState<AppIdSource>("none");

  useEffect(() => {
    setUrlErr(parseErrorFromUrl());

    // 1) URL
    const fromUrl = readAppIdFromUrlWithSource();
    if (fromUrl.appId) {
      setAppId(fromUrl.appId);
      setAppIdSource(fromUrl.source);
      try {
        sessionStorage.setItem("oasis_app_id", fromUrl.appId);
      } catch {}
      return;
    }

    // 2) cached (UX continuity)
    try {
      const cached = sessionStorage.getItem("oasis_app_id");
      if (cached && cached.trim()) {
        setAppId(cached.trim());
        setAppIdSource("cached");
        return;
      }
    } catch {}

    setAppId(null);
    setAppIdSource("none");
  }, []);

  const clock = useMemo(() => {
    const h = pad2(now.getHours());
    const m = pad2(now.getMinutes());
    const s = pad2(now.getSeconds());
    return `${h}:${m}:${s}`;
  }, [now]);

  const headerStyle = useMemo(() => {
    return {
      background: `rgba(2, 6, 23, 0.72)`,
      borderBottomColor: `rgba(255,255,255, 0.10)`,
      backdropFilter: `blur(14px)`,
    } as React.CSSProperties;
  }, []);

  const footerStyle = useMemo(() => {
    const bg = `rgba(2, 6, 23, ${0.28 + railT * 0.55})`;
    const border = `rgba(255,255,255, ${0.06 + railT * 0.10})`;
    const blur = 10 + railT * 10;
    return {
      background: bg,
      borderTopColor: border,
      backdropFilter: `blur(${blur}px)`,
    } as React.CSSProperties;
  }, [railT]);

  const showExpired =
    (urlErr?.error_code || "").toLowerCase().includes("otp_expired") ||
    (urlErr?.error || "").toLowerCase().includes("access_denied");

  const submit = async () => {
    setStatus(null);

    const a = (pw || "").trim();
    const b = (pw2 || "").trim();

    if (!a || a.length < 8) return setStatus("Password must be at least 8 characters.");
    if (a !== b) return setStatus("Passwords do not match.");

    // Guard: if appId exists but not UUID, warn early
    if (appId && !isUuidLike(appId)) {
      return setStatus(
        'Invalid app_id format. Expected a UUID (example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").'
      );
    }

    setBusy(true);

    try {
      // 1) Set password (invite/reset link should already have established a session)
      const { error } = await supabase.auth.updateUser({ password: a });
      if (error) throw error;

      // 2) Confirm we have a session token (required for Edge Function provisioning)
      const token = await getAccessTokenOrNull();
      if (!token) {
        setStatus(
          "Password set, but session was not established. Please open the newest invite email and try again."
        );
        return;
      }

      // 3) Call provisioning Edge Function (it resolves app_id if missing and completes provisioning)
      setStatus("Password set. Resolving provisioning context…");

      const effective = appId && isUuidLike(appId) ? appId : null;
      const out = await callProvisioningEdge(token, effective);

      if (!out.ok) {
        setStatus(`Provisioning failed: ${out.error || "unknown_error"}`);
        return;
      }

      // 4) Update badge immediately from backend-returned app_id
      if (out.app_id && isUuidLike(out.app_id)) {
        setAppId(out.app_id);
        setAppIdSource("resolved");
        try {
          sessionStorage.setItem("oasis_app_id", out.app_id);
        } catch {}
      }

      setStatus("Password set. Account activated.");
      window.location.href = "/";
    } catch (e: any) {
      setStatus(e?.message ?? "Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  const appIdBadge = useMemo(() => {
    if (!appId || !isUuidLike(appId)) return null;

    const label =
      appIdSource === "query"
        ? "query"
        : appIdSource === "hash"
        ? "hash"
        : appIdSource === "cached"
        ? "cached"
        : appIdSource === "resolved"
        ? "resolved"
        : "context";

    return (
      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Provisioning Context
          </div>
          <div className="rounded-full border border-amber-300/25 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200">
            {label}
          </div>
        </div>
        <div className="mt-1 font-mono text-xs text-zinc-300 break-all">{appId}</div>
      </div>
    );
  }, [appId, appIdSource]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      {/* Sticky OS Header */}
      <div className="sticky top-0 z-50 border-b" style={headerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
                Oasis Portal
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                Account Provisioning
              </div>
            </div>

            <div className="hidden md:flex flex-1 justify-center">
              <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 text-center">
                  System Time
                </div>
                <div className="mt-0.5 font-mono text-xs text-zinc-300 tabular-nums text-center">
                  {clock}
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Authority Surface
              </div>
              <div className="mt-1 font-mono text-xs text-zinc-400">v0.1 • Credentials</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col px-6 py-10">
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[520px]">
            <div className="mb-6 text-center">
              <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Oasis Portal</div>
              <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Create your password</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-300/90">
                This credential binds your access to the authority gateway. No operations occur here.
              </p>
            </div>

            {showExpired ? (
              <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-950/25 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-red-300">
                  Link invalid or expired
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  This invite/reset link has already been used or has expired. Request a new invite and
                  use the newest email.
                </div>
              </div>
            ) : null}

            {/* Badge-critical: if app_id exists, show it as a badge; otherwise show a "will resolve" panel */}
            {appIdBadge ? (
              appIdBadge
            ) : (
              <div className="mb-4 rounded-2xl border border-amber-300/25 bg-amber-950/15 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200">
                  Provisioning context will be resolved
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  This link is missing <span className="font-mono text-amber-200">app_id</span>. That is
                  expected on some Supabase auth flows. After you set your password, the portal will
                  resolve your application context automatically and complete provisioning.
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/25 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.60)]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">Credentials</div>

              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
                />
              </div>

              <button
                onClick={submit}
                disabled={busy}
                className={[
                  "mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
                  busy
                    ? "cursor-not-allowed border border-white/10 bg-zinc-900/40 text-zinc-400"
                    : "bg-amber-300 text-zinc-900 hover:bg-amber-200",
                ].join(" ")}
              >
                {busy ? "Saving…" : "Set password"}
              </button>

              {status ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
                  {status}
                </div>
              ) : null}

              <div className="mt-5 text-xs leading-5 text-zinc-500">
                If you did not expect this invitation, you may close this page.
              </div>
            </div>
          </div>
        </main>

        <div className="mt-10 border-t" style={footerStyle}>
          <div className="mx-auto max-w-6xl px-6 py-5">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                This surface performs no operations.
              </div>
              <div className="text-xs text-zinc-500">
                Verification and certificates resolve on sovereign terminals.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
