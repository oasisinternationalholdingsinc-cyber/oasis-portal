"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeUrl(url?: string | null) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  return s.replace(/\/+$/, "");
}

const LEDGER_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_LEDGER_APP_URL) ||
  "https://ledger.oasisintlholdings.com";

const RE_URL = normalizeUrl(process.env.NEXT_PUBLIC_REAL_ESTATE_APP_URL);
const LOUNGE_URL = normalizeUrl(process.env.NEXT_PUBLIC_LOUNGE_APP_URL);

const AXIOM_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_AXIOM_APP_URL) ||
  normalizeUrl(process.env.NEXT_PUBLIC_AXOOM_APP_URL) ||
  "/axiom";

const HOLDINGS_URL = "https://oasisintlholdings.com";

// Public Authority Gateway sovereign surfaces (keep separate)
const VERIFY_URL = "https://sign.oasisintlholdings.com/verify.html";
const CERTIFICATE_URL = "https://sign.oasisintlholdings.com/certificate.html";
const SIGN_URL = "https://sign.oasisintlholdings.com/sign.html";

// ✅ Admissions surface (ONBOARDING is canonical now)
const ONBOARDING_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_ONBOARDING_APP_URL) ||
  "https://onboarding.oasisintlholdings.com";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function useClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useHeaderEngagement() {
  const [t, setT] = useState(0); // 0..1
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      // Engage within first ~140px, fully engaged by ~320px
      const start = 140;
      const end = 320;
      const raw = (y - start) / (end - start);
      setT(Math.max(0, Math.min(1, raw)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return t;
}

// ✅ parse hash fragments like "#error=...&error_code=otp_expired"
function parseHashParams() {
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const sp = new URLSearchParams(raw);
  return {
    code: sp.get("code"),
    access_token: sp.get("access_token"),
    refresh_token: sp.get("refresh_token"),
    error: sp.get("error"),
    error_code: sp.get("error_code"),
    error_description: sp.get("error_description"),
    type: sp.get("type"),
  };
}

function Tile({
  title,
  subtitle,
  description,
  href,
  external,
  disabled,
  badge,
}: {
  title: string;
  subtitle: string;
  description: string;
  href?: string | null;
  external?: boolean;
  disabled?: boolean;
  badge?: string;
}) {
  const base =
    "group rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition";
  const hover = disabled
    ? "opacity-50 cursor-not-allowed"
    : "hover:border-amber-400/60 hover:shadow-[0_0_0_1px_rgba(250,204,21,0.35),0_18px_60px_rgba(0,0,0,0.65)]";

  const inner = (
    <div className={`${base} ${hover}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
            {subtitle}
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">
            {title}
          </div>
        </div>

        {badge ? (
          <div className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-sm leading-6 text-zinc-300/90">
        {description}
      </div>

      <div className="mt-5">
        <div
          className={[
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold",
            disabled
              ? "border border-zinc-800 bg-zinc-900/30 text-zinc-500"
              : "bg-amber-300 text-zinc-900 hover:bg-amber-200",
          ].join(" ")}
        >
          {disabled ? "Offline" : external ? "Open" : "Enter"}
        </div>

        {!disabled ? (
          <div className="mt-2 text-[11px] text-zinc-500">
            {external ? "Opens in a new tab" : "Opens inside Oasis-OS"}
          </div>
        ) : (
          <div className="mt-2 text-[11px] text-zinc-500">Coming online</div>
        )}
      </div>
    </div>
  );

  if (disabled) return inner;

  if (external) {
    return (
      <a href={href ?? "#"} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }

  return <Link href={href ?? "/"}>{inner}</Link>;
}

export default function Launchpad() {
  const router = useRouter();

  // ✅ AUTH GUARD (NO UI CHANGES): route auth params whether in query OR hash
  useEffect(() => {
    const url = new URL(window.location.href);

    // Query params (PKCE)
    const qCode = url.searchParams.get("code");
    if (qCode) {
      router.replace("/auth/callback" + window.location.search);
      return;
    }

    // Hash params (tokens or errors)
    const h = parseHashParams();

    // Hash token flow
    if (h.access_token && h.refresh_token) {
      router.replace("/auth/callback" + window.location.hash);
      return;
    }

    // Hash error flow (THIS IS YOUR CASE: otp_expired)
    if (h.error || h.error_code) {
      const qs = new URLSearchParams();
      if (h.error) qs.set("error", h.error);
      if (h.error_code) qs.set("error_code", h.error_code);
      if (h.error_description) qs.set("error_description", h.error_description);
      if (h.type) qs.set("type", h.type);
      router.replace("/auth/set-password?" + qs.toString());
      return;
    }

    // Query error flow (fallback)
    const qErr = url.searchParams.get("error") || url.searchParams.get("error_code");
    if (qErr) {
      router.replace("/auth/set-password" + window.location.search);
      return;
    }
  }, [router]);

  const now = useClock();
  const t = useHeaderEngagement();

  const clock = useMemo(() => {
    const h = pad2(now.getHours());
    const m = pad2(now.getMinutes());
    const s = pad2(now.getSeconds());
    return `${h}:${m}:${s}`;
  }, [now]);

  const headerStyle = useMemo(() => {
    const bg = `rgba(2, 6, 23, ${0.35 + t * 0.45})`;
    const border = `rgba(255,255,255, ${0.06 + t * 0.10})`;
    const blur = 10 + t * 10;
    return {
      background: bg,
      borderBottomColor: border,
      backdropFilter: `blur(${blur}px)`,
    } as React.CSSProperties;
  }, [t]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      {/* Sticky OS-style header rail (no new nav, just persistence + clock) */}
      <div className="sticky top-0 z-50 border-b" style={headerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
                Oasis Public Authority Gateway
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                Routing Surface — No Operations
              </div>
            </div>

            {/* Center clock (OS authority marker) */}
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
                Launchpad
              </div>
              <div className="mt-1 font-mono text-xs text-zinc-400">
                v0.1 • Terminals + Admissions + Ledger
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <main className="flex flex-1 flex-col justify-center">
          <div className="mt-12 max-w-2xl">
            <div className="text-3xl font-semibold leading-tight text-zinc-100">
              Official access to verification, certificates, onboarding — and
              the institutional ledger.
            </div>
            <div className="mt-4 text-sm leading-7 text-zinc-300/90">
              This gateway routes to sovereign authority surfaces. No records are
              created here. Authority actions execute on dedicated terminals.
            </div>
          </div>

          {/* PRIMARY: Sovereign authority terminals */}
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Tile
              subtitle="Authority Terminal"
              title="Sign"
              description="Execute authorized signing ceremonies on the sovereign signature surface. Signing occurs only on dedicated terminals."
              href={SIGN_URL}
              external
              badge="Terminal"
            />

            <Tile
              subtitle="Authority Terminal"
              title="Verify"
              description="Verify the authenticity and registration status of an official record using its ledger hash or envelope reference."
              href={VERIFY_URL}
              external
              badge="Read-Only"
            />

            <Tile
              subtitle="Authority Terminal"
              title="Certificate"
              description="View or download an official certificate associated with a verified record. Certificates resolve only through registered evidence."
              href={CERTIFICATE_URL}
              external
              badge="Certified"
            />
          </div>

          {/* SECONDARY: Institution + Admissions + Ledger */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tile
                subtitle="Institution"
                title="Oasis International Holdings"
                description="Institutional boundary, governance authority, and public trust surface of the Oasis ecosystem."
                href={HOLDINGS_URL}
                external
              />
            </div>

            <div className="lg:col-span-1">
              <Tile
                subtitle="Admissions Surface"
                title="Onboarding"
                description="Begin formal onboarding into the Oasis governance ecosystem. Intake occurs on a separate admissions surface."
                href={ONBOARDING_URL}
                external
                badge="Intake"
              />
            </div>
          </div>

          {/* INSTITUTIONAL SYSTEM: Ledger (restrained but explicit) */}
          <div className="mt-6">
            <Tile
              subtitle="Institutional System"
              title="Digital Parliament Ledger"
              description="Canonical system of record for Oasis governance. Access is role-gated and admission-based."
              href={LEDGER_URL}
              external
              badge="Authorized"
              disabled={!LEDGER_URL}
            />
          </div>

          {/* Optional (quiet): Future systems if env vars exist — keep restrained */}
          {(RE_URL || LOUNGE_URL) && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Tile
                subtitle="Platform"
                title="Real Estate"
                description="Operational surface for real-estate workflows within the Oasis ecosystem."
                href={RE_URL}
                external
                badge="Platform"
                disabled={!RE_URL}
              />
              <Tile
                subtitle="Platform"
                title="Lounge"
                description="Operational surface for lounge workflows within the Oasis ecosystem."
                href={LOUNGE_URL}
                external
                badge="Platform"
                disabled={!LOUNGE_URL}
              />
              <Tile
                subtitle="Intelligence Layer"
                title="AXIOM"
                description="Read-only intelligence layer for timelines, signals, and institutional context."
                href={AXIOM_URL}
                external={AXIOM_URL !== "/axiom"} // if internal route, keep internal
                badge="Read-Only"
                disabled={!AXIOM_URL}
              />
            </div>
          )}

          <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs leading-5 text-zinc-500">
            <div>This gateway performs no operations.</div>
            <div>Verification and certificates resolve on sovereign surfaces.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
