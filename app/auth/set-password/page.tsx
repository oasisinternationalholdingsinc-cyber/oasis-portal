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

export default function SetPasswordPage() {
  const railT = useRailEngagement();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [urlErr, setUrlErr] = useState<any>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [appIdSource, setAppIdSource] = useState<AppIdSource>("none");

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

  const submit = async () => {
    setStatus(null);
    if (pw.length < 8) return setStatus("Password must be at least 8 characters.");
    if (pw !== pw2) return setStatus("Passwords do not match.");

    setBusy(true);
    try {
      await supabase.auth.updateUser({ password: pw });
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      const email = data?.user?.email;

      if (!userId || !email) return setStatus("Session not established.");

      let effectiveAppId = appId && isUuidLike(appId) ? appId : await resolveLatestAppIdByEmail(email);
      if (!effectiveAppId) return setStatus("Provisioning context unresolved.");

      await supabase.rpc("admissions_complete_provisioning", {
        p_application_id: effectiveAppId,
        p_user_id: userId,
      });

      window.location.href = "/";
    } catch (e: any) {
      setStatus(e.message || "Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  const footerStyle = {
    background: `rgba(2,6,23,${0.28 + railT * 0.55})`,
    borderTopColor: `rgba(255,255,255,${0.06 + railT * 0.1})`,
    backdropFilter: `blur(${10 + railT * 10}px)`,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-[520px]">
          <div className="mb-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Oasis Portal</div>
            <h1 className="mt-2 text-2xl font-semibold">Create your password</h1>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
            <input
              type="password"
              placeholder="New password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mb-3 w-full rounded-xl px-4 py-3"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="mb-4 w-full rounded-xl px-4 py-3"
            />

            <button
              onClick={submit}
              disabled={busy}
              className="w-full rounded-xl bg-amber-300 px-4 py-3 font-semibold text-zinc-900"
            >
              {busy ? "Saving…" : "Set password"}
            </button>

            {status && <div className="mt-4 text-sm text-zinc-300">{status}</div>}
          </div>
        </div>
      </main>

      <div className="border-t" style={footerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-zinc-500">
          Oasis International Holdings • Institutional Operating System
        </div>
      </div>
    </div>
  );
}
