// app/(public)/page.tsx
"use client";

import Link from "next/link";

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  external?: boolean;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function TileCard(t: Tile) {
  const shell =
    "group rounded-2xl border border-white/10 bg-black/25 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition";
  const hover =
    "hover:border-amber-300/25 hover:bg-black/30 hover:shadow-[0_0_0_1px_rgba(250,204,21,0.14),0_22px_70px_rgba(0,0,0,0.65)]";

  const content = (
    <div className={cx(shell, hover)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
            {t.eyebrow}
          </div>
          <div className="mt-2 text-xl font-semibold text-zinc-100">{t.title}</div>
        </div>

        {t.badge ? (
          <div className="rounded-full border border-amber-300/20 bg-amber-950/10 px-3 py-1 text-[10px] tracking-[0.22em] text-amber-200">
            {t.badge}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{t.description}</p>

      <div className="mt-6 flex items-center gap-3 text-xs tracking-[0.18em] text-zinc-500">
        <span className="font-mono text-zinc-300">{t.href}</span>
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
    },
    {
      eyebrow: "Public Verification",
      title: "Verify",
      description:
        "Verify an archived document by hash, envelope, or record reference. Read-only.",
      href: "https://sign.oasisintlholdings.com/verify.html",
      badge: "Read-only",
      external: true,
    },
    {
      eyebrow: "Public Receipt",
      title: "Certificate",
      description:
        "View an authoritative certificate for verified records. Immutable terminal output.",
      href: "https://sign.oasisintlholdings.com/certificate.html",
      badge: "Receipt",
      external: true,
    },
    {
      eyebrow: "Admissions",
      title: "Apply for Access",
      description:
        "Submit an onboarding application. This gateway routes triage → admission → provisioning.",
      href: "/apply",
      badge: "Public",
    },
    {
      eyebrow: "Client Console",
      title: "Enter Client Launchpad",
      description:
        "Private surface for admitted operators. If you have credentials, proceed to secure entry.",
      href: "/client",
      badge: "Private",
    },
    {
      eyebrow: "Institutional Access",
      title: "Login",
      description:
        "Credential terminal. Establishes a cookie-truth session for private access only.",
      href: "/login",
      badge: "Authority",
    },
  ];

  return (
    <div className="relative">
      {/* Subtle authority glow (PUBLIC, calm) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 right-10 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 left-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <section className="max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            Public Authority Gateway
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
            Oasis Portal
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            This is a public routing surface. It does not execute governance. It routes
            to sovereign terminals (Sign / Verify / Certificate) and admissions intake.
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

        <div className="mt-12 text-xs tracking-[0.18em] text-zinc-500">
          Oasis International Holdings • Institutional Operating System
        </div>
      </div>
    </div>
  );
}
