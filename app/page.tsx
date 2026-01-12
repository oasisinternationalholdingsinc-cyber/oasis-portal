// app/page.tsx
"use client";

import { useEffect, useState } from "react";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function PublicAuthorityGateway() {
  const now = useClock();
  const clock = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(
    now.getUTCSeconds()
  )} UTC`;

  return (
    <div className="authority-frame">
      {/* HEADER */}
      <header className="authority-header">
        <div className="left">
          <div className="brand">OASIS OS</div>
          <div className="sub">DIGITAL PARLIAMENT LEDGER</div>
        </div>

        <div className="center">
          <div className="clock">
            <span className="label">SYSTEM TIME</span>
            <span className="value">{clock}</span>
          </div>
        </div>

        <div className="right">
          <span className="surface">AUTHORITY SURFACE</span>
        </div>
      </header>

      {/* HERO */}
      <main className="authority-main">
        <section className="hero">
          <h1>
            Official access to verification, certificates, and onboarding.
          </h1>
          <p>
            This gateway routes to sovereign authority surfaces. No records are
            created here. Authority actions execute on dedicated terminals.
            Client systems are accessed through the private portal.
          </p>
        </section>

        {/* CARDS */}
        <section className="grid">
          <div className="card">
            <div className="eyebrow">AUTHORITY TERMINAL</div>
            <h3>Sign</h3>
            <p>
              Execute authorized signing ceremonies on sovereign terminals.
              Signing occurs only on dedicated surfaces.
            </p>
            <a
              href="https://sign.oasisintlholdings.com/sign.html"
              target="_blank"
              className="cta"
            >
              Open
            </a>
          </div>

          <div className="card">
            <div className="eyebrow">AUTHORITY TERMINAL</div>
            <h3>Verify</h3>
            <p>
              Verify the authenticity and registration status of an official
              record using its ledger hash or envelope reference.
            </p>
            <a
              href="https://sign.oasisintlholdings.com/verify.html"
              target="_blank"
              className="cta"
            >
              Open
            </a>
          </div>

          <div className="card">
            <div className="eyebrow">AUTHORITY TERMINAL</div>
            <h3>Certificate</h3>
            <p>
              View or download an official certificate associated with a
              verified record.
            </p>
            <a
              href="https://sign.oasisintlholdings.com/certificate.html"
              target="_blank"
              className="cta"
            >
              Open
            </a>
          </div>

          <div className="card">
            <div className="eyebrow">ADMISSIONS SURFACE</div>
            <h3>Onboarding</h3>
            <p>
              Begin formal onboarding into the Oasis governance ecosystem.
              Intake occurs on a separate admissions surface.
            </p>
            <a
              href="https://onboarding.oasisintlholdings.com"
              target="_blank"
              className="cta"
            >
              Open
            </a>
          </div>

          <div className="card">
            <div className="eyebrow">CLIENT PORTAL</div>
            <h3>Client Access</h3>
            <p>
              Authenticate to enter the private client launchpad. Admission-based
              access to institutional systems and document exchange.
            </p>
            <a href="/client" className="cta">
              Open
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="authority-footer">
        Oasis International Holdings · Institutional Operating System
      </footer>
    </div>
  );
}
