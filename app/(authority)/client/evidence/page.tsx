// app/(authority)/client/evidence/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type EvidenceTask = {
  id: string;
  application_id: string;
  task_key: string;
  title: string;
  notes: string | null;
  required: boolean;
  channels: string[] | null;
  due_at: string | null;
  status: string;
  created_at: string | null;
};

function fmtDue(due?: string | null) {
  if (!due) return "—";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusTone(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "done") return "good";
  if (v === "cancelled" || v === "rejected") return "warn";
  return "neutral";
}

function Chip({
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

export default function ClientEvidencePage() {
  const sb = useMemo(() => supabase(), []);
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [tasks, setTasks] = useState<EvidenceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // NOTE: this page is “authority/client” scoped; keep it calm:
  // show tasks only if the user is authenticated.
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const { data } = await sb.auth.getUser();
        if (!mounted) return;
        setEmail(data.user?.email ?? null);
        setSessionReady(true);
      } catch {
        if (!mounted) return;
        setEmail(null);
        setSessionReady(true);
      }
    }

    boot();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sb]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setErr(null);
      setLoading(true);

      try {
        // If no session, don’t query (avoids noise).
        const { data: userData } = await sb.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          if (!mounted) return;
          setTasks([]);
          setLoading(false);
          return;
        }

        // Minimal read: show latest tasks across applications.
        // IMPORTANT: no schema changes, no new views required.
        // This relies on your existing table + RLS for the client user.
        const { data, error } = await sb
          .from("onboarding_provisioning_tasks")
          .select(
            "id,application_id,task_key,title,notes,required,channels,due_at,status,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (!mounted) return;
        setTasks((data as EvidenceTask[]) || []);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load evidence tasks");
        setLoading(false);
      }
    }

    if (sessionReady) load();

    return () => {
      mounted = false;
    };
  }, [sb, sessionReady]);

  const pending = tasks.filter((t) => statusTone(t.status) === "neutral");
  const requiredPending = pending.filter((t) => !!t.required);

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
          This surface activates when an admissions officer requests documents.
          No execution occurs here — evidence only.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Chip
            label="Access"
            value={email ? "Authenticated" : "Session Required"}
            tone={email ? "good" : "warn"}
          />
          <Chip
            label="Pending"
            value={email ? `${pending.length} open` : "—"}
            tone={email ? "neutral" : "warn"}
          />
          <Chip
            label="Required"
            value={email ? `${requiredPending.length} required` : "—"}
            tone={requiredPending.length > 0 ? "warn" : "neutral"}
          />
        </div>

        {!email ? (
          <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-950/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
              Access Required
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              Your session is not available on this surface. Continue to the
              authentication terminal.
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/login?next=/client/evidence"
                className="inline-flex items-center justify-center rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-200"
              >
                Go to Login
              </Link>
              <Link
                href="/client"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-amber-300/25 hover:bg-black/30"
              >
                Return to Client Console
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Requested evidence
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  Items are generated by CI-Admissions via provisioning tasks.
                </div>
              </div>

              <Link
                href="/client"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-amber-300/25 hover:bg-black/30"
              >
                Return to Client Console
              </Link>
            </div>

            {loading ? (
              <div className="mt-5 text-sm text-zinc-400">Loading…</div>
            ) : err ? (
              <div className="mt-5 rounded-xl border border-red-500/25 bg-red-950/10 p-4 text-sm text-zinc-200">
                {err}
              </div>
            ) : tasks.length === 0 ? (
              <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-950/10 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
                  No requests
                </div>
                <div className="mt-2 text-sm text-zinc-300">
                  Nothing is requested right now. When an admissions officer
                  requests documents, they will appear here.
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {tasks.map((t) => {
                  const tone = statusTone(t.status);
                  const border =
                    tone === "good"
                      ? "border-amber-300/20"
                      : tone === "warn"
                      ? "border-red-500/25"
                      : "border-white/10";
                  const bg =
                    tone === "good"
                      ? "bg-amber-950/10"
                      : tone === "warn"
                      ? "bg-red-950/10"
                      : "bg-black/20";

                  return (
                    <div
                      key={t.id}
                      className={cx("rounded-2xl border p-5", border, bg)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                            {t.required ? "Required" : "Optional"} •{" "}
                            {(t.status || "PENDING").toUpperCase()}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-zinc-100">
                            {t.title}
                          </div>
                          {t.notes ? (
                            <div className="mt-2 text-sm leading-6 text-zinc-400">
                              {t.notes}
                            </div>
                          ) : null}
                        </div>

                        <div className="text-right text-xs text-zinc-500">
                          <div>Due: {fmtDue(t.due_at)}</div>
                          <div className="mt-1">
                            App:{" "}
                            <span className="text-zinc-300">
                              {t.application_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                          Upload
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          Upload wiring is next. This page is the canonical
                          landing zone for task-driven evidence exchange.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
