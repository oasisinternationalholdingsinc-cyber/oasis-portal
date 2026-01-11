"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

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
  const [t, setT] = useState(0);
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

function isUuidLike(x: string) {
  const s = (x || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
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

async function resolveLatestAppIdByEmail(email: string): Promise<string | null> {
  const e = (email || "").trim().toLowerCase();
  if (!e) return null;

  const { data } = await supabase
    .from("onboarding_applications")
    .select("id")
    .ilike("applicant_email", e)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

function extractRpcErrorMessage(err: any): string {
  const msg = err?.message || "RPC_FAILED";
  return msg;
}

function shortId(id: string, head = 8, tail = 6) {
  const s = (id || "").trim();
  if (!s) return "";
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function sourceLabel(s: AppIdSource) {
  switch (s) {
    case "query":
      return "URL";
    case "hash":
      return "HASH";
    case "cached":
      return "CACHED";
    case "resolved":
      return "RESOLVED";
    default:
      return "—";
  }
}

export default function SetPasswordPage() {
  const railT = useRailEngagement();
  const now = useClock();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [urlErr, setUrlErr] = useState<any>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [appIdSource, setAppIdSource] = useState<AppIdSource>("none");
  const [copied, setCopied] = useState<null | "short" | "full">(null);

  useEffect(() => {
    setUrlErr(parseErrorFromUrl());

    const fromUrl = readAppIdFromUrlWithSource();
    if (fromUrl.appId) {
      setAppId(fromUrl.appId);
      setAppIdSource(fromUrl.source);
      sessionStorage.setItem("oasis_app_id", fromUrl.appId);
      return;
    }

    const cached = sessionStorage.getItem("oasis_app_id");
    if (cached) {
      setAppId(cached);
      setAppIdSource("cached");
    }
  }, []);

  const appIdOk = useMemo(() => !!(appId && isUuidLike(appId)), [appId]);

  const submit = async () => {
    setStatus(null);
    setCopied(null);

    if (pw.length < 8) return setStatus("Password must be at least 8 characters.");
    if (pw !== pw2) return setStatus("Passwords do not match.");

    setBusy(true);
    try {
      await supabase.auth.updateUser({ password: pw });

      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      const email = data?.user?.email;

      if (!userId || !email) return setStatus("Session not established.");

      let effectiveAppId =
        appId && isUuidLike(appId) ? appId : await resolveLatestAppIdByEmail(email);

      if (!effectiveAppId) return setStatus("Provisioning context unresolved.");

      // UI-only: if we had to resolve, reflect it in the badge (no behavior change)
      if (!appId || !isUuidLike(appId)) {
        setAppId(effectiveAppId);
        setAppIdSource("resolved");
        sessionStorage.setItem("oasis_app_id", effectiveAppId);
      }

      const { error: rpcErr } = await supabase.rpc("admissions_complete_provisioning", {
        p_application_id: effectiveAppId,
        p_user_id: userId,
      });

      if (rpcErr) return setStatus(extractRpcErrorMessage(rpcErr));

      window.location.href = "/";
    } catch (e: any) {
      setStatus(e?.message || "Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  const footerStyle = {
    background: `rgba(2,6,23,${0.28 + railT * 0.55})`,
    borderTopColor: `rgba(255,255,255,${0.06 + railT * 0.1})`,
    backdropFilter: `blur(${10 + railT * 10}px)`,
  } as React.CSSProperties;

  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      {/* OS-ish top bar (visual only; no wiring) */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-[11px] tracking-[.28em] uppercase text-[rgba(255,214,128,.85)]">
              Oasis OS
            </div>
            <div className="text-[11px] uppercase tracking-[.28em] text-zinc-500">
              Authority Terminal
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] tracking-[.22em] text-zinc-300">
            SYSTEM TIME&nbsp;&nbsp;{clock}
          </div>
        </div>
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-[560px]">
          <div className="mb-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Oasis Portal
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Create your password</h1>

            {/* Context badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] tracking-[.18em] text-zinc-300">
                APPLICATION
                <span className="text-white/90">
                  {appIdOk ? shortId(appId!) : "—"}
                </span>
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] tracking-[.18em] text-zinc-300">
                SOURCE <span className="text-white/90">{sourceLabel(appIdSource)}</span>
              </span>

              {appIdOk && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await safeCopy(shortId(appId!));
                      setCopied(ok ? "short" : null);
                      setTimeout(() => setCopied(null), 1200);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] tracking-[.18em] text-zinc-200 hover:bg-black/35"
                  >
                    COPY SHORT
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await safeCopy(appId!);
                      setCopied(ok ? "full" : null);
                      setTimeout(() => setCopied(null), 1200);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] tracking-[.18em] text-zinc-200 hover:bg-black/35"
                  >
                    COPY FULL
                  </button>
                </>
              )}
            </div>

            {copied && (
              <div className="mt-2 text-xs text-zinc-400">
                Copied {copied === "full" ? "full" : "short"} application ID.
              </div>
            )}

            {/* URL errors from auth redirect (if any) */}
            {urlErr?.error && (
              <div className="mt-3 text-xs text-amber-200/80">
                {urlErr.error_description || urlErr.error}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-6 shadow-[0_0_0_1px_rgba(255,255,255,.04),0_25px_80px_rgba(0,0,0,.55)]">
            <label className="mb-2 block text-[11px] uppercase tracking-[.22em] text-zinc-500">
              New password
            </label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[rgba(255,214,128,.45)] focus:ring-2 focus:ring-[rgba(255,214,128,.12)]"
            />

            <label className="mb-2 block text-[11px] uppercase tracking-[.22em] text-zinc-500">
              Confirm password
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="mb-5 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[rgba(255,214,128,.45)] focus:ring-2 focus:ring-[rgba(255,214,128,.12)]"
            />

            <button
              onClick={submit}
              disabled={busy}
              className="w-full rounded-xl bg-amber-300 px-4 py-3 font-semibold text-zinc-900 shadow-[0_8px_30px_rgba(255,214,128,.12)] transition disabled:opacity-60"
            >
              {busy ? "Saving…" : "Set password"}
            </button>

            {status && <div className="mt-4 text-sm text-zinc-300">{status}</div>}

            {!status && (
              <div className="mt-4 text-xs text-zinc-500">
                This terminal provisions access after password creation.
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="border-t border-white/10" style={footerStyle}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 text-xs text-zinc-500">
          <div>Oasis International Holdings • Institutional Operating System</div>
          <div className="text-zinc-600">Authority Surface</div>
        </div>
      </div>
    </div>
  );
}
