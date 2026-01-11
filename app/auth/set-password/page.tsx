"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
  return err?.message || "RPC_FAILED";
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

function sourceChipClass(s: AppIdSource) {
  // Keep these subtle (enterprise). No neon.
  switch (s) {
    case "query":
      return "border-[rgba(255,214,128,.22)] bg-[rgba(255,214,128,.08)] text-[rgba(255,214,128,.92)]";
    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "hash":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "cached":
      return "border-white/10 bg-white/5 text-zinc-200";
    default:
      return "border-white/10 bg-black/25 text-zinc-300";
  }
}

export default function SetPasswordPage() {
  const railT = useRailEngagement();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [urlErr, setUrlErr] = useState<any>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [appIdSource, setAppIdSource] = useState<AppIdSource>("none");
  const [copied, setCopied] = useState<null | "short" | "full">(null);

  useEffect(() => {
    // ✅ CRITICAL: prevent an existing operator session from contaminating invite flow
    // If a different user is currently signed in, updateUser/getUser/rpc can bind to the wrong identity.
    supabase.auth.signOut();

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

      const effectiveAppId =
        appId && isUuidLike(appId) ? appId : await resolveLatestAppIdByEmail(email);

      if (!effectiveAppId) return setStatus("Provisioning context unresolved.");

      // UI-only: reflect resolved context in the badge (no behavior change)
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

      // ✅ IMPORTANT: route to INTERNAL client launchpad (NOT public)
      window.location.href = "/client";
    } catch (e: any) {
      setStatus(e?.message || "Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  const pageBg = {
    // Keep this "quiet" so the host OS chrome doesn't feel doubled.
    background: `radial-gradient(circle at top, rgba(2,12,36,.85) 0%, rgba(2,6,23,.92) 45%, rgba(0,0,0,.98) 100%)`,
  } as React.CSSProperties;

  const ambientStyle = {
    // Subtle surface breathing as you scroll (keeps it alive without fighting host chrome)
    boxShadow: `0 0 0 1px rgba(255,255,255,${0.04 + railT * 0.03}), 0 25px 90px rgba(0,0,0,${
      0.55 + railT * 0.12
    })`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen text-zinc-100" style={pageBg}>
      {/* CONTENT ONLY: no local header/footer (host OS already provides chrome) */}
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-[640px]">
          <div className="mb-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Oasis Portal</div>
            <h1 className="mt-2 text-2xl font-semibold">Create your password</h1>

            {/* Context badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,214,128,.22)] bg-[rgba(255,214,128,.07)] px-3 py-1 text-[11px] tracking-[.18em] text-[rgba(255,214,128,.92)]">
                APPLICATION{" "}
                <span className="text-white/90">{appIdOk ? shortId(appId!) : "—"}</span>
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] tracking-[.18em] ${sourceChipClass(
                  appIdSource
                )}`}
              >
                SOURCE <span className="text-white/90">{sourceLabel(appIdSource)}</span>
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] tracking-[.18em] ${
                  appIdOk ? "text-emerald-200" : "text-amber-200/90"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    appIdOk ? "bg-emerald-400/80" : "bg-amber-300/80"
                  }`}
                />
                {appIdOk ? "CONTEXT VERIFIED" : "CONTEXT MISSING"}
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

            {urlErr?.error && (
              <div className="mt-3 text-xs text-amber-200/80">
                {urlErr.error_description || urlErr.error}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-6" style={ambientStyle}>
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
    </div>
  );
}
