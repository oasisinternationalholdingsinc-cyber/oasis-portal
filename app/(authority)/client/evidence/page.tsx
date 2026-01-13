// app/(authority)/client/evidence/page.tsx
"use client";

import Link from "next/link";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ClientEvidenceStubPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <section className="max-w-3xl">
        <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          Evidence Exchange
        </div>

        <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
          Submit Evidence
        </h1>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          This surface is reserved for requested documents (e.g., incorporation
          articles, proof of address, identity materials). No execution occurs in
          this portal.
        </p>

        <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-950/10 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
            Coming online
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            Evidence upload will activate by mandate. When an admissions officer
            requests documents, they’ll appear here with clear instructions and
            an audit-visible status.
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/client"
              className={cx(
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                "bg-amber-300 text-black hover:bg-amber-200"
              )}
            >
              Return to Client Console
            </Link>

            <div className="text-[11px] text-zinc-500">
              Upload wiring is intentionally dormant until lint is complete.
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Authority rules
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
            <div>• No governance execution occurs in this portal.</div>
            <div>• Signing and verification remain terminal-bound.</div>
            <div>• Evidence is submitted only when explicitly requested.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
