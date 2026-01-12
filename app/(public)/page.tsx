// app/(public)/page.tsx
"use client";

import Link from "next/link";

type TileKind = "terminal" | "public" | "private" | "authority";

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  external?: boolean;
  kind: TileKind;
  cta?: string;
  subtle?: boolean;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function badgeTone(kind: TileKind) {
  switch (kind) {
    case "terminal":
      return "border-amber-300/20 bg-amber-950/12 text-amber-200";
    case "private":
      return "border-white/12 bg-white/5 text-zinc-200";
    case "authority":
      return "border-amber-300/18 bg-black/30 text-amber-200";
    case "public":
    default:
      return "border-white/10 bg-black/25 text-zinc-300";
  }
}

function TileCard(t: Tile) {
  const shell = cx(
    "group rounded-3xl border bg-black/22 p-7 shadow-[0_26px_110px_rgba(0,0,0,0.55)] backdrop-blur transition",
    t.subtle ? "border-white/8" : "border-white/10"
  );

  const hover = t.subtle
    ? "hover:border-white/14 hover:bg-black/26"
    : "hover:border-amber-300/22 hover:bg-black/28 hover:shadow-[0_0_0_1px_rgba(250,204,21,0.14),0_34px_130px_rgba(0,0,0,0.68)]";

  const content = (
    <div className={cx(shell, hover)}>
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/90">
            {t.eyebrow}
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">{t.title}</div>
        </div>

        {t.badge ? (
          <div
            className={cx(
              "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]",
              badgeTone(t.kind)
            )}
          >
            {t.badge}
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{t.description}</p>

      <div className="mt-6 flex items-center gap-3 text-xs tracking-[0.18em] text-zinc-500">
        <span className="text-zinc-300">{t.cta ?? "Open →"}</span>
        <span className="opacity-60">→</span>
      </div>
    </div>
  );

  return t.external ? (
    <a href={t.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <Link href={t.href}>{content}</Link>
  );
}

export default function PublicLaunchpad() {
  const tiles: Tile[] = [
    {
      eyebrow: "Sovereign Terminal",
      title: "Sign",
      description:
        "Execute signature-required records. This terminal is purpose-built for signing only.",
      href: "https://sign.oasisintlholdings.com/sign.html",
      badge: "Terminal",
      external: true,
      kind: "terminal",
      cta: "Open terminal",
    },
    {
      eyebrow: "Public Verification",
      title: "Verify",
      description:
        "Verify an archived document by hash, envelope, or record reference. Read-only.",
      href: "https://sign.oasisintlholdings.com/verify.html",
      badge: "Read-only",
      external: true,
      kind: "terminal",
      cta: "Open verification",
    },
    {
      eyebrow: "Public Receipt",
      title: "Certificate",
      description:
        "View an authoritative certificate for verified records. Immutable terminal output.",
      href: "https://sign.oasisintlholdings.com/certificate.html",
      badge: "Receipt",
      external: true,
      kind: "terminal",
      cta: "Open certificate",
    },
    {
      eyebrow: "Admissions",
      title: "Apply for Access",
      description:
        "Institutional intake is handled through the Onboarding Gateway. Submissions route triage → admission → provisioning.",
      href: "https://onboarding.oasisintlholdings.com",
      badge: "Intake",
      external: true,
      kind: "public",
      cta: "Open onboarding gateway",
    },
    {
      eyebrow: "Client Console",
      title: "Enter Client Launchpad",
      description:
        "Private surface for admitted operators. Authentication is enforced on entry.",
      href: "/client",
      badge: "Private",
      kind: "private",
      cta: "Enter",
    },
  ];

  const authority: Tile = {
    eyebrow: "Authority",
    title: "Authority Login",
    description:
      "Credential terminal for institutional operators. Not client-facing.",
    href: "/login",
    badge: "Internal",
    kind: "authority",
    cta: "Authenticate",
    subtle: true,
  };

  return (
    <div className="relative">
      <section className="max-w-3xl">
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
          Public Authority Gateway
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-100">Oasis Portal</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          This is a public routing surface. It does not execute governance. It routes to
          sovereign terminals (Sign / Verify / Certificate) and institutional intake.
        </p>

        <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Policy
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            Public first. Private access requires credentials. Signing and verification remain
            terminal-bound.
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {tiles.map((t) => (
          <TileCard key={t.title} {...t} />
        ))}
      </section>

      {/* Authority is present but de-emphasized */}
      <section className="mt-6 max-w-3xl">
        <TileCard {...authority} />
      </section>

      {/* Holdings presence (comfort + legitimacy) */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Operated by
        </div>
        <div className="mt-2 text-sm text-zinc-300">
          Oasis International Holdings • Institutional Operating System
        </div>
        <div className="mt-1 text-xs tracking-[0.18em] text-zinc-500">
          Verification over persuasion • Evidence over claims
        </div>
      </div>
    </div>
  );
}
