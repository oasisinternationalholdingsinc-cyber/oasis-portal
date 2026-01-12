"use client";

// app/(public)/page.tsx
import Link from "next/link";

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  external?: boolean;
  cta?: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
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
      description: "Begin formal onboarding into the Oasis governance ecosystem (intake → review → provisioning).",
      href: "https://onboarding.oasisintlholdings.com",
      badge: "Intake",
      external: true,
      cta: "OPEN ONBOARDING",
    },
    {
      eyebrow: "Institution",
      title: "Oasis International Holdings",
      description: "Institutional boundary, governance authority, and public trust surface of the Oasis ecosystem.",
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
        <section className="max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
            Public Authority Gateway
          </div>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-100">
            Official access to verification, certificates, and onboarding.
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            This gateway routes to sovereign authority surfaces. No records are created here.
            Authority actions execute on dedicated terminals. Client systems are accessed through the private portal.
          </p>
        </section>

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
