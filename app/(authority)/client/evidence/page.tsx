// app/(authority)/client/evidence/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type EvidenceRow = {
  id: string;
  application_id: string;
  kind: string;
  title: string | null;
  storage_bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  metadata: any;
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

function fmtTs(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "done") return "good";
  if (v === "cancelled" || v === "rejected") return "warn";
  return "neutral";
}

function taskKeyToEvidenceKind(taskKey: string): EvidenceRow["kind"] {
  const k = (taskKey || "").toLowerCase();
  if (k.includes("incorporation")) return "incorporation";
  if (k.includes("address")) return "proof_of_address";
  if (k.includes("id")) return "id_document";
  if (k.includes("tax")) return "tax";
  return "other";
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
      ? "border-emerald-400/25 bg-emerald-950/10 text-zinc-100"
      : tone === "warn"
      ? "border-amber-300/25 bg-amber-950/10 text-zinc-100"
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
  const [uid, setUid] = useState<string | null>(null);

  const [tasks, setTasks] = useState<EvidenceTask[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const { data } = await sb.auth.getUser();
        if (!mounted) return;
        setEmail(data.user?.email ?? null);
        setUid(data.user?.id ?? null);
        setSessionReady(true);
      } catch {
        if (!mounted) return;
        setEmail(null);
        setUid(null);
        setSessionReady(true);
      }
    }

    boot();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
      setUid(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sb]);

  async function loadAll() {
    setErr(null);
    setLoading(true);

    try {
      const { data: userData } = await sb.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setTasks([]);
        setEvidence([]);
        setLoading(false);
        return;
      }

      const { data: tData, error: tErr } = await sb
        .from("onboarding_provisioning_tasks")
        .select(
          "id,application_id,task_key,title,notes,required,channels,due_at,status,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (tErr) throw tErr;

      const appIds = Array.from(
        new Set(((tData as EvidenceTask[]) || []).map((t) => t.application_id))
      );

      let eData: EvidenceRow[] = [];
      if (appIds.length > 0) {
        const { data: ev, error: eErr } = await sb
          .from("onboarding_evidence")
          .select(
            "id,application_id,kind,title,storage_bucket,storage_path,file_name,mime_type,size_bytes,uploaded_by,uploaded_at,is_verified,verified_by,verified_at,metadata"
          )
          .in("application_id", appIds)
          .order("uploaded_at", { ascending: false })
          .limit(200);

        if (eErr) throw eErr;
        eData = (ev as EvidenceRow[]) || [];
      }

      setTasks((tData as EvidenceTask[]) || []);
      setEvidence(eData);
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || "Failed to load evidence tasks");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionReady) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady]);

  const pending = tasks.filter((t) => statusTone(t.status) === "neutral");
  const requiredPending = pending.filter((t) => !!t.required);

  const evidenceByTask = useMemo(() => {
    // map evidence to a "best guess" task_key by parsing storage_path prefix:
    // <application_id>/<task_key>/...
    const m = new Map<string, EvidenceRow[]>();
    for (const e of evidence) {
      const parts = (e.storage_path || "").split("/");
      const taskKey = parts.length >= 2 ? parts[1] : "";
      const key = `${e.application_id}::${taskKey}`;
      const arr = m.get(key) || [];
      arr.push(e);
      m.set(key, arr);
    }
    return m;
  }, [evidence]);

  async function handleUpload(t: EvidenceTask) {
    const inp = fileInputs.current[t.id];
    const f = inp?.files?.[0];
    if (!f) return;

    setBusyKey(t.id);
    setErr(null);

    try {
      const { data: userData } = await sb.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Session required");

      const safeName = f.name.replace(/[^\w.\-() ]+/g, "_");
      const storageBucket = "onboarding";
      const storagePath = `${t.application_id}/${t.task_key}/${safeName}`;

      // 1) upload file to storage
      const up = await sb.storage.from(storageBucket).upload(storagePath, f, {
        upsert: true,
        contentType: f.type || "application/octet-stream",
      });

      if (up.error) throw up.error;

      // 2) insert evidence row
      const kind = taskKeyToEvidenceKind(t.task_key);

      const { error: insErr } = await sb.from("onboarding_evidence").insert({
        application_id: t.application_id,
        kind,
        title: t.title,
        storage_bucket: storageBucket,
        storage_path: storagePath,
        file_name: f.name,
        mime_type: f.type || null,
        size_bytes: f.size ?? null,
        uploaded_by: userId,
        metadata: {
          task_key: t.task_key,
          task_id: t.id,
          client_email: email || null,
        },
      });

      if (insErr) throw insErr;

      // clear input + refresh
      if (inp) inp.value = "";
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusyKey(null);
    }
  }

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
                  Uploading a document submits it for review.
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Applications in scope:{" "}
                  <span className="text-zinc-300">
                    {Array.from(new Set(tasks.map((t) => t.application_id)))
                      .length || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={loadAll}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-amber-300/25 hover:bg-black/30"
                >
                  Refresh
                </button>
                <Link
                  href="/client"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-amber-300/25 hover:bg-black/30"
                >
                  Return to Client Console
                </Link>
              </div>
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
                      ? "border-emerald-400/20"
                      : tone === "warn"
                      ? "border-amber-300/25"
                      : "border-white/10";
                  const bg =
                    tone === "good"
                      ? "bg-emerald-950/10"
                      : tone === "warn"
                      ? "bg-amber-950/10"
                      : "bg-black/20";

                  const evKey = `${t.application_id}::${t.task_key}`;
                  const evRows = evidenceByTask.get(evKey) || [];

                  return (
                    <div key={t.id} className={cx("rounded-2xl border p-5", border, bg)}>
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
                            <span className="text-zinc-300">{t.application_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                              Upload
                            </div>
                            <div className="mt-1 text-sm text-zinc-400">
                              Choose a file, then submit. It will be recorded in the evidence ledger.
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              ref={(el) => {
                                fileInputs.current[t.id] = el;
                              }}
                              type="file"
                              className="block w-[260px] text-xs text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-100 hover:file:bg-white/15"
                            />
                            <button
                              onClick={() => handleUpload(t)}
                              disabled={busyKey === t.id}
                              className={cx(
                                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                                busyKey === t.id
                                  ? "cursor-not-allowed bg-white/5 text-zinc-500"
                                  : "bg-amber-300 text-black hover:bg-amber-200"
                              )}
                            >
                              {busyKey === t.id ? "Submitting…" : "Submit Evidence"}
                            </button>
                          </div>
                        </div>

                        {evRows.length > 0 ? (
                          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                              Submitted
                            </div>
                            <div className="mt-2 space-y-2">
                              {evRows.slice(0, 3).map((e) => (
                                <div
                                  key={e.id}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2"
                                >
                                  <div className="text-sm text-zinc-200">
                                    {e.file_name || e.title || "Evidence"}
                                    <span className="ml-2 text-xs text-zinc-500">
                                      ({e.kind})
                                    </span>
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {fmtTs(e.uploaded_at)} •{" "}
                                    <span className={e.is_verified ? "text-emerald-300" : "text-amber-200"}>
                                      {e.is_verified ? "Verified" : "Pending review"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 text-xs text-zinc-500">
                            No evidence submitted for this request yet.
                          </div>
                        )}
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
