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

const AXIOM_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_AXIOM_APP_URL) ||
  normalizeUrl(process.env.NEXT_PUBLIC_AXOOM_APP_URL);

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatPrincipalEmail(email?: string | null) {
  const e = (email || "").trim();
  if (!e) return "—";
  if (e.length <= 34) return e;
  return `${e.slice(0, 16)}…${e.slice(-12)}`;
}

function InstrumentChip({
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
      ? "border-amber-300/25 bg-amber-950/10 text-zinc-100"
      : tone === "warn"
      ? "border-red-500/25 bg-red-950/10 text-zinc-100"
      : "border-white/10 bg-black/25 text-zinc-100";

  return (
    <div className={cx("rounded-xl border px-3 py-2", toneClass)}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
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

function GateCard({
  eyebrow,
  title,
  description,
  href,
  badge,
  cta = "Enter",
  disabled,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  cta?: string;
  disabled?: boolean;
}) {
  const shell =
    "rounded-2xl border border-white/10 bg-black/35 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.70)]";
  const hover = disabled
    ? "opacity-60 cursor-not-allowed"
    : "hover:border-amber-300/35 hover:bg-black/45 hover:shadow-[0_0_0_1px_rgba(250,204,21,0.22),0_30px_100px_rgba(0,0,0,0.75)]";

  const content = (
    <div className={cx("group transition", shell, hover)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/90">
            {eyebrow}
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">{title}</div>
        </div>

        {badge ? (
          <div className="rounded-full border border-amber-300/20 bg-amber-950/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200/90">
            {badge}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>

      <div className="mt-7 flex items-center gap-3">
        <div
          className={cx(
            "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition",
            disabled
              ? "border border-white/10 bg-zinc-900/40 text-zinc-400"
              : "bg-amber-300 text-black hover:bg-amber-200"
          )}
        >
          {disabled ? "Offline" : cta}
        </div>

        <div className="text-[11px] text-zinc-500">
          {disabled ? "Unavailable" : "Authorized entry — opens in a new tab"}
        </div>
      </div>
    </div>
  );

  if (disabled || !href) return content;

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function HeaderSessionPill({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
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

export default function ClientLaunchpadPage() {
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // IMPORTANT: resolve once per page load
  const sb = useMemo(() => supabaseBrowser(), []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        // NOTE: do NOT redirect from here (middleware is the gate).
        // We only hydrate UI identity if available.
        const { data } = await sb.auth.getUser();
        if (!mounted) return;

        setAuthEmail(data.user?.email ?? null);
        setAuthChecked(true);
      } catch {
        if (!mounted) return;
        setAuthEmail(null);
        setAuthChecked(true);
      }
    }

    boot();

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
    await sb.auth.signOut();
    // no hard redirect required; middleware will gate on next navigation
    window.location.assign("/login?next=/client");
  }

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-14">
        <section className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Client Console
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
            Authorizing…
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Establishing secure session and loading your workspace.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Session
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Verifying credentials
            </div>
          </div>
        </section>
      </main>
    );
  }

  // If middleware allowed us here but UI cannot read identity yet, we remain calm.
  // If middleware *didn't* allow, the request would be redirected before render.
  const accessValue = authEmail ? "Authenticated" : "Session Required";
  const accessTone: "good" | "warn" = authEmail ? "good" : "warn";

  const provisionValue = authEmail ? "Active" : "Inactive";
  const provisionTone: "good" | "warn" = authEmail ? "good" : "warn";

  const evidenceValue = authEmail ? "0 pending" : "Sign in required";
  const evidenceTone: "neutral" | "warn" = authEmail ? "neutral" : "warn";

  // ✅ ONLY CHANGE: activate tile → route to /client/evidence (stub page)
  const primaryUpload: Tile = {
    eyebrow: "Evidence Exchange",
    title: "Submit Evidence",
    description:
      "Submit requested evidence and operational documents. Execution does not occur on this surface.",
    href: "/client/evidence",
    badge: "Private",
    cta: "Open",
    disabled: false,
  };

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
      disabled: !AXIOM_URL,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <section className="max-w-3xl">
        <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          Client Console
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
          Private access to institutional systems and secure document exchange.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Admission surface. Signing and verification remain terminal-bound.
        </p>

        {authEmail ? (
          <div className="mt-6">
            <HeaderSessionPill email={authEmail} onSignOut={handleSignOut} />
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-950/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
              Access Required
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              Your session is not available on this surface. Continue to the
              authentication terminal.
            </div>
            <div className="mt-4">
              <Link
                href="/login?next=/client"
                className="inline-flex items-center justify-center rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InstrumentChip label="Access" value={accessValue} tone={accessTone} />
          <InstrumentChip
            label="Provisioning"
            value={provisionValue}
            tone={provisionTone}
          />
          <InstrumentChip
            label="Evidence Inbox"
            value={evidenceValue}
            tone={evidenceTone}
          />
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Support Channel
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Evidence and communications surfaces activate by mandate.
            </div>
          </div>

          <TileCard {...primaryUpload} />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Subsystems
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Workspace channels remain inactive until engaged.
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
              Ingress
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Authorized entry to the institutional record.
            </div>
          </div>

          <GateCard
            eyebrow="Institutional Record"
            title="Enter Digital Parliament Ledger"
            description="Canonical system of record for governance. Access is admission-based and role-gated."
            href={LEDGER_URL}
            badge="Authorized"
            cta="Enter Ledger"
            disabled={!LEDGER_URL}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
              Authority Rules
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              <div>• No execution occurs in this portal.</div>
              <div>• Signing runs only on sovereign terminals.</div>
              <div>• Verification and certificates resolve on authority surfaces.</div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-950/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
                Institutional Discipline
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                Gold indicates verified state and authority actions — never decoration.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Inactive Channels
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Messages, requests, and evidence workflows engage as needed.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Dormant Surfaces
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Present but restrained. Enabled by mandate.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryTiles
            .filter((t) => t.title !== "AXIOM" || AXIOM_URL)
            .map((t) => (
              <TileCard key={t.title} {...t} />
            ))}
        </div>
      </section>

      <div className="mt-14 text-center text-xs text-zinc-500">
        Portal performs no execution. Sovereign verification and signing remain terminal-bound.
      </div>
    </main>
  );
}
