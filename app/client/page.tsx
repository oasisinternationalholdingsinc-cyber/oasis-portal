// app/client/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  external?: boolean;
  badge?: string;
  disabled?: boolean;
  cta?: string;
};

function normalizeUrl(url?: string | null) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  return s.replace(/\/+$/, "");
}

const LEDGER_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_LEDGER_APP_URL) ||
  "https://ledger.oasisintlholdings.com";

// Optional: if you later want AXIOM exposed to clients (read-only)
const AXIOM_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_AXIOM_APP_URL) ||
  normalizeUrl(process.env.NEXT_PUBLIC_AXOOM_APP_URL);

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatPrincipalEmail(email?: string | null) {
  const e = (email || "").trim();
  if (!e) return "—";
  // Keep it institutional: show full email unless extremely long.
  if (e.length <= 34) return e;
  return `${e.slice(0, 16)}…${e.slice(-12)}`;
}

function TileCard({
  eyebrow,
  title,
  description,
  href,
  external,
  badge,
  disabled,
  cta = "Open",
}: Tile) {
  const shell =
    "group rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition";
  const hover = disabled
    ? "opacity-55 cursor-not-allowed"
    : "hover:border-amber-300/30 hover:bg-black/40 hover:shadow-[0_0_0_1px_rgba(250,204,21,0.18),0_22px_70px_rgba(0,0,0,0.65)]";

  const content = (
    <div className={cx(shell, hover)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
            {eyebrow}
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">{title}</div>
        </div>

        {badge ? (
          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
            {badge}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>

      <div className="mt-6">
        <div
          className={cx(
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
            disabled
              ? "border border-white/10 bg-zinc-900/40 text-zinc-400"
              : "bg-amber-300 text-black hover:bg-amber-200"
          )}
        >
          {disabled ? "Offline" : cta}
        </div>

        <div className="mt-2 text-[11px] text-zinc-500">
          {disabled
            ? "Coming online"
            : external
            ? "Opens in a new tab"
            : "Opens inside Oasis Portal"}
        </div>
      </div>
    </div>
  );

  if (disabled || !href) return content;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}

function StatusCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "border-amber-300/20 bg-amber-950/15"
      : tone === "warn"
      ? "border-red-500/20 bg-red-950/15"
      : "border-white/10 bg-black/25";

  return (
    <div className={cx("rounded-2xl border p-5", toneClass)}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function HeaderSessionPill({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  // This is CONTENT-ONLY. It does not replace your OS sticky header.
  // It reinforces "production mode" inside the client surface with identity + exit.
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-amber-300/90" />
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Session
        </div>
        <div className="text-sm font-semibold text-zinc-100">
          {formatPrincipalEmail(email)}
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-300/25 hover:bg-black/30"
      >
        Sign out
      </button>
    </div>
  );
}

// ===== Main (CONTENT ONLY — header/footer live in app/layout.tsx) =====
export default function ClientLaunchpadPage() {
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // IMPORTANT: supabaseBrowser() returns a client. Resolve once per page load.
  const sb = useMemo(() => supabaseBrowser(), []);

  useEffect(() => {
    let mounted = true;

    // Initial resolve (client truth)
    sb.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setAuthEmail(data.user?.email ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthEmail(null);
      });

    // Live updates (login/logout/token refresh)
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sb]);

  async function handleSignOut() {
    // No wiring changes elsewhere: this is a standard supabase sign-out.
    await sb.auth.signOut();
  }

  const primaryTiles: Tile[] = [
    {
      eyebrow: "Institutional System",
      title: "Digital Parliament Ledger",
      description:
        "Canonical system of record for governance. Access is admission-based and role-gated.",
      href: LEDGER_URL,
      external: true,
      badge: "Authorized",
      cta: "Open Ledger",
      disabled: !LEDGER_URL,
    },
    {
      eyebrow: "Evidence Exchange",
      title: "Upload Documents",
      description:
        "Submit requested evidence and operational documents. Execution does not occur on this surface.",
      href: "/client/upload",
      badge: "Private",
      cta: "Upload",
      disabled: true, // enable once /client/upload exists
    },
  ];

  const secondaryTiles: Tile[] = [
    {
      eyebrow: "Workspace",
      title: "Messages",
      description:
        "Secure communications for evidence requests, updates, and next steps.",
      badge: "Coming Online",
      disabled: true,
    },
    {
      eyebrow: "Workspace",
      title: "Requests",
      description: "Structured requests with clear status and audit visibility.",
      badge: "Coming Online",
      disabled: true,
    },
    {
      eyebrow: "Intelligence Layer",
      title: "AXIOM",
      description:
        "Read-only institutional context and signals. Advisory only; never blocks workflows.",
      href: AXIOM_URL || undefined,
      external: true,
      badge: "Read-only",
      disabled: !AXIOM_URL, // stays hidden/off unless you set env
    },
  ];

  // Production tone: declarative, fewer explanations. Let state speak.
  const accessValue = authEmail ? "Authenticated" : "Unauthenticated";
  const accessTone: "good" | "warn" = authEmail ? "good" : "warn";

  const provisionValue = authEmail ? "Provisioned / Active" : "Not provisioned";
  const evidenceValue = authEmail ? "No pending requests" : "Sign in required";

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      {/* HERO */}
      <section className="max-w-3xl">
        <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          Client Workspace
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
          Private access to institutional systems and secure document exchange.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          This surface is admission-based. Signing and verification remain
          terminal-bound.
        </p>

        {/* SESSION PILL (ONLY WHEN AUTHENTICATED) */}
        {authEmail ? (
          <div className="mt-6">
            <HeaderSessionPill email={authEmail} onSignOut={handleSignOut} />
          </div>
        ) : null}
      </section>

      {/* 3-ZONE BODY */}
      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT: Status */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
              System Status
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Operational surface
            </div>
          </div>

          <StatusCard label="Access" value={accessValue} tone={accessTone} />
          <StatusCard
            label="Provisioning"
            value={provisionValue}
            tone="neutral"
          />
          <StatusCard
            label="Evidence Inbox"
            value={evidenceValue}
            tone="neutral"
          />

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Support
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Evidence and communications surfaces activate by mandate.
            </div>
          </div>
        </div>

        {/* CENTER: Primary Actions */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
              Primary Actions
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Institutional systems and evidence exchange.
            </div>
          </div>

          {primaryTiles.map((t) => (
            <TileCard key={t.title} {...t} />
          ))}
        </div>

        {/* RIGHT: Authority Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
              Authority Boundary
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>Execution does not occur in this portal.</p>
              <p>Signing ceremonies run only on sovereign terminals.</p>
              <p>
                Verification and certificates resolve on dedicated authority
                surfaces.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-950/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
                Institutional Discipline
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                Gold indicates verified state and authority actions — never
                decoration.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Coming Online
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Messages, requests, and evidence workflows activate as needed.
            </div>
          </div>
        </div>
      </section>

      {/* SECONDARY GRID */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Additional Surfaces
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              Present but restrained. Enabled by mandate.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryTiles
            .filter((t) => t.title !== "AXIOM" || AXIOM_URL) // keep hidden unless configured
            .map((t) => (
              <TileCard key={t.title} {...t} />
            ))}
        </div>
      </section>

      {/* Footnote (content only; footer rail in layout) */}
      <div className="mt-14 text-center text-xs text-zinc-500">
        Portal performs no execution. Sovereign verification and signing remain
        terminal-bound.
      </div>
    </main>
  );
}
