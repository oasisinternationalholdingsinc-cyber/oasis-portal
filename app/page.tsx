// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type Tile = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  badge?: string;
};

function TileCard(t: Tile) {
  const inner = (
    <div className="og-card">
      <div className="og-card-top">
        <div>
          <div className="og-eyebrow">{t.eyebrow}</div>
          <div className="og-title">{t.title}</div>
        </div>
        {t.badge ? <div className="og-badge">{t.badge}</div> : null}
      </div>

      <div className="og-desc">{t.description}</div>

      <div className="og-cta">
        <span>Open</span>
        <span className="og-arrow">→</span>
      </div>
    </div>
  );

  if (t.external) {
    return (
      <a href={t.href} target="_blank" rel="noreferrer" className="og-link">
        {inner}
      </a>
    );
  }

  return (
    <Link href={t.href} className="og-link">
      {inner}
    </Link>
  );
}

export default function PublicAuthorityGateway() {
  const now = useClock();
  const clock = useMemo(() => {
    return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(
      now.getUTCSeconds()
    )} UTC`;
  }, [now]);

  const tiles: Tile[] = [
    {
      eyebrow: "Authority Terminal",
      title: "Sign",
      description:
        "Execute authorized signing ceremonies on sovereign terminals. Signing occurs only on dedicated surfaces.",
      href: "https://sign.oasisintlholdings.com/sign.html",
      external: true,
      badge: "Terminal",
    },
    {
      eyebrow: "Authority Terminal",
      title: "Verify",
      description:
        "Verify the authenticity and registration status of an official record using its ledger hash or envelope reference.",
      href: "https://sign.oasisintlholdings.com/verify.html",
      external: true,
      badge: "Read-only",
    },
    {
      eyebrow: "Authority Terminal",
      title: "Certificate",
      description:
        "View or download an official certificate associated with a verified record.",
      href: "https://sign.oasisintlholdings.com/certificate.html",
      external: true,
      badge: "Certified",
    },
    {
      eyebrow: "Admissions Surface",
      title: "Onboarding",
      description:
        "Begin formal onboarding into the Oasis governance ecosystem. Intake occurs on a separate admissions surface.",
      href: "https://onboarding.oasisintlholdings.com",
      external: true,
      badge: "Intake",
    },
    {
      eyebrow: "Client Portal",
      title: "Client Access",
      description:
        "Authenticate to enter the private client launchpad. Admission-based access to institutional systems and document exchange.",
      href: "/client",
      badge: "Private",
    },
  ];

  return (
    <div className="oasis-gateway">
      {/* ambient authority field */}
      <div aria-hidden className="og-field og-field-a" />
      <div aria-hidden className="og-field og-field-b" />
      <div aria-hidden className="og-field og-field-c" />

      <div className="og-frame">
        <header className="og-header">
          <div className="og-left">
            <div className="og-brand">OASIS OS</div>
            <div className="og-sub">DIGITAL PARLIAMENT LEDGER</div>
          </div>

          <div className="og-center">
            <div className="og-clock">
              <div className="og-clock-label">SYSTEM TIME</div>
              <div className="og-clock-value">{clock}</div>
            </div>
          </div>

          <div className="og-right">AUTHORITY SURFACE</div>
        </header>

        <main className="og-main">
          <section className="og-hero">
            <h1>Official access to verification, certificates, and onboarding.</h1>
            <p>
              This gateway routes to sovereign authority surfaces. No records are created here.
              Authority actions execute on dedicated terminals. Client systems are accessed
              through the private portal.
            </p>
          </section>

          <section className="og-grid">
            {tiles.map((t) => (
              <TileCard key={t.title} {...t} />
            ))}
          </section>

          <div className="og-note">
            This gateway performs no operations. Verification and certificates resolve on sovereign
            surfaces.
          </div>
        </main>

        <footer className="og-footer">
          Oasis International Holdings · Institutional Operating System
        </footer>
      </div>
    </div>
  );
}
