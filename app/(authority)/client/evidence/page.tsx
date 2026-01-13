// app/(authority)/client/evidence/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import InstitutionalFrame from "@/components/shell/InstitutionalFrame";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type AppRow = {
  id: string;
  status: string | null;
  applicant_email: string | null;
  organization_legal_name: string | null;
  organization_trade_name: string | null;
  submitted_at: string | null;
  updated_at: string | null;
};

type TaskRow = {
  id: string;
  application_id: string;
  task_key: string;
  title: string;
  notes: string | null;
  required: boolean;
  status: string;
  due_at: string | null;
  channels: string[] | null;
  created_at: string | null;
};

function Pill({
  tone,
  children,
}: {
  tone: "gold" | "slate" | "green" | "red";
  children: React.ReactNode;
}) {
  const cls =
    tone === "gold"
      ? "border-amber-300/30 bg-amber-950/25 text-amber-200"
      : tone === "green"
      ? "border-emerald-300/25 bg-emerald-950/20 text-emerald-200"
      : tone === "red"
      ? "border-rose-300/25 bg-rose-950/20 text-rose-200"
      : "border-white/10 bg-white/5 text-zinc-300";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase",
        cls
      )}
    >
      {children}
    </span>
  );
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normStatus(s: string | null | undefined) {
  return (s || "").trim();
}

function isPendingTaskStatus(s: string) {
  const v = s.toUpperCase();
  return v === "PENDING" || v === "OPEN" || v === "REQUESTED";
}

export default function ClientEvidencePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [app, setApp] = useState<AppRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  // ✅ Reactive contract:
  // - We only "light up" when there are tasks (especially required+pending) OR status is needs_info.
  const appStatus = normStatus(app?.status);
  const hasTasks = tasks.length > 0;

  const pendingRequiredCount = useMemo(() => {
    return tasks.filter((t) => t.required && isPendingTaskStatus(t.status)).length;
  }, [tasks]);

  const shouldActivate = useMemo(() => {
    if (appStatus.toLowerCase() === "needs_info") return true;
    if (pendingRequiredCount > 0) return true;
    if (hasTasks) return true;
    return false;
  }, [appStatus, pendingRequiredCount, hasTasks]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      // Auth-required surface (client must be signed in)
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (!cancelled) {
          setLoading(false);
          setErr("SESSION_REQUIRED");
        }
        return;
      }

      // 1) Find the caller’s most recent application (by primary_contact_user_id)
      const { data: appRow, error: appErr } = await supabase
        .from("onboarding_applications")
        .select(
          "id,status,applicant_email,organization_legal_name,organization_trade_name,submitted_at,updated_at"
        )
        .eq("primary_contact_user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appErr) {
        if (!cancelled) {
          setErr(appErr.message);
          setLoading(false);
        }
        return;
      }

      if (!appRow) {
        if (!cancelled) {
          setApp(null);
          setTasks([]);
          setLoading(false);
        }
        return;
      }

      // 2) Load provisioning tasks for this application
      const { data: taskRows, error: taskErr } = await supabase
        .from("onboarding_provisioning_tasks")
        .select(
          "id,application_id,task_key,title,notes,required,status,due_at,channels,created_at"
        )
        .eq("application_id", appRow.id)
        .order("required", { ascending: false })
        .order("due_at", { ascending: true })
        .order("created_at", { ascending: true });

      if (taskErr) {
        if (!cancelled) {
          setApp(appRow as AppRow);
          setTasks([]);
          setErr(taskErr.message);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setApp(appRow as AppRow);
        setTasks((taskRows || []) as TaskRow[]);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InstitutionalFrame>
      <main className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Evidence Exchange
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-zinc-100">Submit Evidence</h1>
            {shouldActivate ? (
              <Pill tone="gold">ACTIVE</Pill>
            ) : (
              <Pill tone="slate">DORMANT</Pill>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-400">
            This surface is reserved for requested documents (e.g., incorporation articles,
            registry proof, identity materials). <span className="text-zinc-300">No execution occurs</span>{" "}
            in this portal.
          </p>
        </div>

        {/* Body */}
        <div className="mt-8 grid gap-6 md:grid-cols-12">
          {/* Left: Application */}
          <section className="md:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-[0_28px_120px_rgba(0,0,0,0.55)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Application
                  </div>
                  <div className="mt-2 text-base font-semibold text-zinc-100">
                    {app?.organization_trade_name ||
                      app?.organization_legal_name ||
                      "No application detected"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {app?.applicant_email || "—"}
                  </div>
                </div>

                {app ? (
                  <Pill tone={appStatus.toLowerCase() === "needs_info" ? "gold" : "slate"}>
                    {appStatus || "UNKNOWN"}
                  </Pill>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Lifecycle
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Submitted</span>
                    <span className="text-zinc-300">{fmtDateTime(app?.submitted_at || null)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Updated</span>
                    <span className="text-zinc-300">{fmtDateTime(app?.updated_at || null)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Required pending</span>
                    <span className="text-zinc-300">{pendingRequiredCount}</span>
                  </div>
                </div>
              </div>

              {/* Session / empty states */}
              {loading ? (
                <div className="mt-5 text-sm text-zinc-500">Loading…</div>
              ) : err === "SESSION_REQUIRED" ? (
                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4">
                  <div className="text-sm text-zinc-300">
                    You must be signed in to view evidence requests.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href="/login"
                      className={cx(
                        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                        "bg-amber-300 text-black hover:bg-amber-200"
                      )}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/"
                      className="text-sm text-zinc-400 underline decoration-white/20 hover:text-zinc-200"
                    >
                      Return to Launchpad
                    </Link>
                  </div>
                </div>
              ) : !app ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-zinc-300">No application is linked to this account.</div>
                  <div className="mt-2 text-sm text-zinc-500">
                    If you just submitted, give it a moment — then refresh.
                  </div>
                </div>
              ) : err ? (
                <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-950/10 p-4">
                  <div className="text-sm text-rose-200">Error loading evidence queue.</div>
                  <div className="mt-2 text-xs text-rose-200/80 break-words">{err}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/client"
                className={cx(
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                  "bg-white/10 text-zinc-100 hover:bg-white/15 border border-white/10"
                )}
              >
                Return to Client Console
              </Link>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className={cx(
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                  "bg-black/30 text-zinc-200 hover:bg-black/40 border border-white/10"
                )}
              >
                Refresh
              </button>
            </div>
          </section>

          {/* Right: Tasks */}
          <section className="md:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-[0_28px_120px_rgba(0,0,0,0.55)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Requested evidence
                  </div>
                  <div className="mt-2 text-sm text-zinc-400">
                    Tasks come from <span className="text-zinc-300">onboarding_provisioning_tasks</span>.
                    Upload is intentionally disabled until evidence wiring is sealed.
                  </div>
                </div>

                {pendingRequiredCount > 0 ? (
                  <Pill tone="gold">{pendingRequiredCount} REQUIRED</Pill>
                ) : hasTasks ? (
                  <Pill tone="slate">{tasks.length} TASKS</Pill>
                ) : (
                  <Pill tone="slate">NONE</Pill>
                )}
              </div>

              {/* Task list */}
              <div className="mt-5 space-y-3">
                {!loading && hasTasks ? (
                  tasks.map((t) => {
                    const pending = isPendingTaskStatus(t.status);
                    const tone =
                      t.required && pending ? "gold" : pending ? "slate" : "green";

                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-zinc-100">
                              {t.title || t.task_key}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500 break-words">
                              Task key: <span className="text-zinc-400">{t.task_key}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {t.required ? <Pill tone="gold">REQUIRED</Pill> : <Pill tone="slate">OPTIONAL</Pill>}
                            <Pill tone={tone as any}>{t.status}</Pill>
                          </div>
                        </div>

                        {t.notes ? (
                          <div className="mt-3 text-sm leading-6 text-zinc-300 whitespace-pre-wrap">
                            {t.notes}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <div>
                            Due: <span className="text-zinc-300">{fmtDateTime(t.due_at)}</span>
                          </div>
                          <div className="h-3 w-px bg-white/10" />
                          <div>
                            Channels:{" "}
                            <span className="text-zinc-300">
                              {(t.channels && t.channels.length > 0 ? t.channels : ["—"]).join(", ")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled
                            className={cx(
                              "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                              "border border-amber-300/20 bg-amber-950/10 text-amber-200",
                              "opacity-60 cursor-not-allowed"
                            )}
                            title="Upload wiring is intentionally dormant until evidence ingestion is finalized."
                          >
                            Upload (coming online)
                          </button>

                          <div className="text-[11px] text-zinc-500">
                            This will activate only by mandate (authority request → task → upload).
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : !loading ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="text-sm text-zinc-300">No evidence has been requested.</div>
                    <div className="mt-2 text-sm text-zinc-500">
                      When an admissions officer requests documents, tasks will appear here with due dates and required flags.
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500">Loading tasks…</div>
                )}
              </div>

              {/* Rules */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Authority rules
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                  <div>• Evidence is submitted only when explicitly requested.</div>
                  <div>• No governance execution occurs in this portal.</div>
                  <div>• Signing and verification remain terminal-bound surfaces.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </InstitutionalFrame>
  );
}
