"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function normalizeUrl(url?: string | null) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  return s.replace(/\/+$/, "");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const LEDGER_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_LEDGER_APP_URL) ||
  "https://ledger.oasisintlholdings.com";

const AXIOM_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_AXIOM_APP_URL) ||
  normalizeUrl(process.env.NEXT_PUBLIC_AXOOM_APP_URL) ||
  "/axiom";

const RE_URL = normalizeUrl(process.env.NEXT_PUBLIC_REAL_ESTATE_APP_URL);
const LOUNGE_URL = normalizeUrl(process.env.NEXT_PUBLIC_LOUNGE_APP_URL);

const ONBOARDING_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_ONBOARDING_APP_URL) ||
  "https://onboarding.oasisintlholdings.com";

// Sovereign/public surfaces (still reachable from portal)
const VERIFY_URL = "https://sign.oasisintlholdings.com/verify.html";
const CERTIFICATE_URL = "https://sign.oasisintlholdings.com/certificate.html";
const SIGN_URL = "https://sign.oasisintlholdings.com/sign.html";

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
  const [t, setT] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
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
          <div className="mt-2 text-xl font-semibold text-zinc-100">{title}</div>
        </div>

        {badge ? (
          <div className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-sm leading-6 text-zinc-300/90">{description}</div>

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
            {external ? "Opens in a new tab" : "Opens inside Portal"}
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
  const now = useClock();
  const t = useHeaderEngagement();

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // For UI display only (middleware already enforced auth)
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

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

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
      {/* Sticky OS-style header rail */}
      <div className="sticky top-0 z-50 border-b" style={headerStyle}>
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
                Oasis Portal
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                Private Client Surface
              </div>
            </div>

            {/* Center clock */}
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

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Session
                </div>
                <div className="mt-1 font-mono text-xs text-zinc-400">
                  {email ?? "—"}
                </div>
              </div>

              <button
                onClick={signOut}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <main className="flex flex-1 flex-col justify-center">
          <div className="mt-12 max-w-2xl">
            <div className="text-3xl font-semibold leading-tight text-zinc-100">
              Admission-based access to Oasis systems.
            </div>
            <div className="mt-4 text-sm leading-7 text-zinc-300/90">
              Your portal is private and role-gated. Requests, uploads, and client workflows
              execute inside this surface. Authority terminals remain sovereign and separate.
            </div>
          </div>

          {/* Client systems */}
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Tile
              subtitle="Institutional System"
              title="Digital Parliament Ledger"
              description="Client access to governance records and workflows via the Ledger client surface."
              href={LEDGER_URL}
              external
              badge="Authorized"
              disabled={!LEDGER_URL}
            />

            <Tile
              subtitle="Client Workspace"
              title="Requests"
              description="Upload documents and respond to formal requests from Oasis authority."
              href="/requests"
              badge="Private"
            />

            <Tile
              subtitle="Intelligence Layer"
              title="AXIOM"
              description="Read-only context and signals associated with your Oasis activity."
              href={AXIOM_URL}
              external={AXIOM_URL !== "/axiom"}
              badge="Read-Only"
              disabled={!AXIOM_URL}
            />
          </div>

          {/* Optional platforms */}
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
              <div className="hidden lg:block" />
            </div>
          )}

          {/* Sovereign / public surfaces (quiet) */}
          <div className="mt-8 border-t border-white/5 pt-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Sovereign Authority Surfaces
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Tile
                subtitle="Authority Terminal"
                title="Sign"
                description="Authorized signing ceremonies occur only on the sovereign signature surface."
                href={SIGN_URL}
                external
                badge="Terminal"
              />
              <Tile
                subtitle="Public Read-Only"
                title="Verify"
                description="Verify authenticity and registration status using hash or envelope reference."
                href={VERIFY_URL}
                external
                badge="Read-Only"
              />
              <Tile
                subtitle="Public Read-Only"
                title="Certificate"
                description="Resolve and view the official certificate for a verified record."
                href={CERTIFICATE_URL}
                external
                badge="Certified"
              />
            </div>

            <div className="mt-6 text-center text-xs leading-5 text-zinc-500">
              Need admission? Use onboarding intake:{" "}
              <a
                className="text-amber-300/80 hover:text-amber-200 underline underline-offset-4"
                href={ONBOARDING_URL}
                target="_blank"
                rel="noreferrer"
              >
                onboarding.oasisintlholdings.com
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
