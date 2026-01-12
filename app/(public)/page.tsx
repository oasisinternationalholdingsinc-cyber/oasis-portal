"use client";

// app/(public)/page.tsx
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  external?: boolean;
  cta?: string;
};

type Tab = {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

function formatClock(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function HeaderTab({
  tab,
  active,
}: {
  tab: Tab;
  active?: boolean;
}) {
  const base =
    "group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.18em] transition";
  const frame = active
    ? "border-amber-300/30 bg-amber-950/20 text-amber-200"
    : "border-white/10 bg-black/20 text-zinc-300 hover:border-amber-300/20 hover:bg-black/28 hover:text-zinc-100";

  const glow =
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:opacity-0 before:transition before:duration-300 before:bg-[radial-gradient(circle_at_30%_10%,rgba(250,204,21,0.18),transparent_55%)] group-hover:before:opacity-100";

  const pill =
    "rounded-full border border-amber-300/15 bg-amber-950/10 px-2 py-0.5 text-[10px] tracking-[0.22em] text-amber-200/90";

  const content = (
    <span className={cx(base, frame, glow)}>
      <span>{tab.label}</span>
      {tab.badge ? <span className={pill}>{tab.badge}</span> : null}
    </span>
  );

  return tab.external ? (
    <a href={tab.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <Link href={tab.href}>{content}</Link>
  );
}

function TileCard(t: Tile) {
  const shell =
    "group relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-7 shadow-[0_28px_120px_rgba(0,0,0,0.55)] transition";
  const hover =
    "hover:border-amber-300/25 hover:bg-black/28 hover:shadow-[0_0_0_1px_rgba(250,204,21,0.12),0_34px_140px_rgba(0,0,0,0.70)]";
  const glow =
    "before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition before:duration-300 before:bg-[radial-gradient(circle_at_30%_10%,rgba(250,204,21,0.12),transparent_55%)] group-hover:before:opacity-100";

  const content = (
    <div className={cx(shell, hover, glow)}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.26em] text-amber-300/90">
            {t.eyebrow}
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">{t.title}</div>
        </div>

        {t.badge ? (
          <div className="rounded-full border border-amber-300/20 bg-amber-950/10 px-3 py-1 text-[10px] tracking-[0.22em] text-amber-200">
            {t.badge}
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{t.description}</p>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs tracking-[0.18em] text-zinc-500">
          {t.external ? "Sovereign terminal" : "Internal route"}
        </div>

        <div className="rounded-full border border-amber-300/20 bg-black/20 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-amber-200 transition group-hover:border-amber-300/35 group-hover:bg-amber-950/20">
          {t.cta ?? "OPEN"} →
        </div>
      </div>

      {/* subtle bottom rail glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-[28rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl opacity-0 transition duration-300 group-hover:opacity-100"
      />
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
  const now = useClock();

  const tabs: Tab[] = useMemo(
    () => [
      { label: "LAUNCHPAD", href: "/", badge: "PUBLIC" },
      { label: "SIGN", href: "https://sign.oasisintlholdings.com/sign.html", external: true, badge: "TERMINAL" },
      { label: "VERIFY", href: "https://sign.oasisintlholdings.com/verify.html", external: true },
      { label: "CERTIFICATE", href: "https://sign.oasisintlholdings.com/certificate.html", external: true, badge: "SEALED" },
      { label: "ONBOARD", href: "https://onboarding.oasisintlholdings.com", external: true, badge: "INTAKE" },
      { label: "CLIENT", href: "/client", badge: "PRIVATE" },
    ],
    []
  );

  const tiles: Tile[] = [
    {
      eyebrow: "Authority Terminal",
      title: "Sign",
      description: "Execute authorized signing ceremonies on sovereign terminals only.",
      href: "https://sign.oasisintlholdings.com/sign.html",
      badge: "Terminal",
      external: true,
      cta: "OPEN TERMINAL",
    },
    {
      eyebrow: "Authority Terminal",
      title: "Verify",
      description: "Verify authenticity and registration status of an official record.",
      href: "https://sign.oasisintlholdings.com/verify.html",
      badge: "Read-only",
      external: true,
      cta: "OPEN VERIFY",
    },
    {
      eyebrow: "Authority Terminal",
      title: "Certificate",
      description: "View or download an official certificate associated with a verified record.",
      href: "https://sign.oasisintlholdings.com/certificate.html",
      badge: "Certified",
      external: true,
      cta: "OPEN CERTIFICATE",
    },
    {
      eyebrow: "Admissions Surface",
      title: "Onboarding",
      description:
        "Begin formal onboarding into the Oasis governance ecosystem (intake → review → provisioning).",
      href: "https://onboarding.oasisintlholdings.com",
      badge: "Intake",
      external: true,
      cta: "OPEN ONBOARDING",
    },
    {
      eyebrow: "Institution",
      title: "Oasis International Holdings",
      description:
        "Institutional boundary, governance authority, and public trust surface of the Oasis ecosystem.",
      href: "https://oasisintlholdings.com",
      badge: "Public",
      external: true,
      cta: "OPEN SITE",
    },
    {
      eyebrow: "Client Portal",
      title: "Client Access",
      description: "Enter the private client launchpad. Authentication is enforced on entry.",
      href: "/client",
      badge: "Private",
      cta: "ENTER",
    },
  ];

  return (
    <div className="relative">
      {/* Authority glow (calm) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-80 w-[56rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 right-10 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 left-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="mx-auto max-w-6xl">
        {/* OS header + digital clock */}
        <div className="sticky top-0 z-40 -mx-4 px-4 pt-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_30px_140px_rgba(0,0,0,0.65)]">
            <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-amber-300/20 bg-amber-950/10 shadow-[0_0_0_1px_rgba(250,204,21,0.10)]" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.30em] text-zinc-400">
                    Public Authority Gateway
                  </div>
                  <div className="mt-1 text-sm font-semibold tracking-wide text-zinc-100">
                    Oasis — Sovereign Surfaces
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 md:justify-end">
                <div className="flex items-baseline gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
                  <div className="text-[10px] uppercase tracking-[0.30em] text-zinc-500">
                    System
                  </div>
                  <div className="font-mono text-sm tracking-[0.20em] text-amber-200">
                    {formatClock(now)}
                  </div>
                </div>

                <a
                  href="https://portal.oasisintlholdings.com"
                  className="hidden rounded-full border border-amber-300/25 bg-amber-950/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-950/18 md:inline-flex"
                >
                  OPEN GATEWAY →
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
              {tabs.map((t) => (
                <HeaderTab key={t.label} tab={t} active={t.href === "/"} />
              ))}
            </div>
          </div>
        </div>

        {/* Intro */}
        <section className="mt-10 max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
            Public Authority Gateway
          </div>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-100">
            Official access to verification, certificates, and onboarding.
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            This gateway routes to sovereign authority surfaces. No records are created here. Authority actions
            execute on dedicated terminals. Client systems are accessed through the private portal.
          </p>
        </section>

        {/* Tiles */}
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiles.map((t) => (
            <TileCard key={t.title} {...t} />
          ))}
        </section>

        <div className="mt-10 text-center text-xs tracking-[0.18em] text-zinc-600">
          This gateway performs no operations. Verification and certificates resolve on sovereign surfaces.
        </div>
      </div>
    </div>
  );
}
