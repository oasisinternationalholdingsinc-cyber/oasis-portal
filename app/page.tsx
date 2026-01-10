"use client";

import Link from "next/link";

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  tag?: string;
};

const TILES: Tile[] = [
  {
    eyebrow: "Authority Terminal",
    title: "Sign",
    description:
      "Execute authorized signing ceremonies on sovereign terminals. Signing occurs only on dedicated surfaces.",
    href: "https://sign.oasisintlholdings.com",
    tag: "Terminal",
  },
  {
    eyebrow: "Authority Terminal",
    title: "Verify",
    description:
      "Verify the authenticity and registration status of an official record using its ledger hash or envelope reference.",
    href: "https://sign.oasisintlholdings.com/verify.html",
    tag: "Read-only",
  },
  {
    eyebrow: "Authority Terminal",
    title: "Certificate",
    description:
      "View or download an official certificate associated with a verified record.",
    href: "https://sign.oasisintlholdings.com/certificate.html",
    tag: "Certified",
  },
  {
    eyebrow: "Admissions Surface",
    title: "Onboarding",
    description:
      "Begin formal onboarding into the Oasis governance ecosystem. Intake occurs on a separate admissions surface.",
    href: "https://onboarding.oasisintlholdings.com",
    tag: "Intake",
  },
  {
    eyebrow: "Institution",
    title: "Oasis International Holdings",
    description:
      "Institutional boundary, governance authority, and public trust surface of the Oasis ecosystem.",
    href: "https://oasisintlholdings.com",
  },

  // ✅ STEP 1: Replace public “Ledger” entry point with Client Access → /login
  {
    eyebrow: "Client Portal",
    title: "Client Access",
    description:
      "Authenticate to enter the private client launchpad. Admission-based access to institutional systems and document exchange.",
    href: "/login",
    tag: "Private",
  },
];

export default function LaunchpadPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      {/* HERO */}
      <section className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-zinc-100">
          Official access to verification, certificates, and onboarding.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          This gateway routes to sovereign authority surfaces. No records are created
          here. Authority actions execute on dedicated terminals. Client systems are
          accessed through the private portal.
        </p>
      </section>

      {/* GRID */}
      <section className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <div
            key={t.title}
            className="group relative rounded-2xl border border-white/10 bg-black/30 p-6 transition hover:border-amber-300/30 hover:bg-black/40"
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
              {t.eyebrow}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-zinc-100">{t.title}</h3>
              {t.tag && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  {t.tag}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-400">{t.description}</p>

            <Link
              href={t.href}
              className="mt-6 inline-flex items-center rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-200"
            >
              Open
            </Link>
          </div>
        ))}
      </section>

      {/* FOOTNOTE */}
      <div className="mt-20 text-center text-xs text-zinc-500">
        This gateway performs no operations. Verification and certificates resolve on
        sovereign surfaces.
      </div>
    </main>
  );
}
