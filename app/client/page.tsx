// app/client/page.tsx
"use client";

import Link from "next/link";

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

// ===== Main (CONTENT ONLY — header/footer live in app/layout.tsx) =====
export default function ClientLaunchpadPage() {
  const primaryTiles: Tile[] = [
    {
      eyebrow: "Institutional System",
      title: "Digital Parliament Ledger",
      description:
        "Canonical system of record for governance. Access remains admission-based and role-gated.",
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
        "Provide requested evidence and operational documents. No governance execution occurs on this surface.",
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
      description:
        "Structured requests for information or actions, with clear audit visibility.",
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
          This surface is authenticated and admission-based. No signing occurs in
          the portal. Execution and verification remain sovereign.
        </p>
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
              Admission-based access surface
            </div>
          </div>

          <StatusCard label="Access" value="Authenticated" tone="good" />
          <StatusCard label="Provisioning" value="Provisioned / Active" tone="neutral" />
          <StatusCard label="Evidence Inbox" value="No pending requests" tone="neutral" />

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Support
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              If you received a request for evidence, use Upload Documents or reply via
              Messages once enabled.
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
              <p>
                This portal performs no governance execution. Signing ceremonies run only
                on sovereign terminals.
              </p>
              <p>
                Verification and certificates resolve on dedicated authority surfaces
                with registered evidence.
              </p>
              <p className="text-zinc-500">
                If you are here to provide evidence, use the Upload Documents surface
                once enabled.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-950/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
                Institutional Discipline
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                Gold indicates authority actions and verified state — not decoration.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Coming Online
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Messages, requests, and evidence workflows will appear here as the system
              expands.
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
              Present but restrained. Enabled as needed.
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
