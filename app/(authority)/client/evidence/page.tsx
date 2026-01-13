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

function safeFileName(name: string) {
  // keep it boring + url-safe
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function kindForTaskKey(taskKey: string): EvidenceRow["kind"] {
  const k = (taskKey || "").toLowerCase();
  if (k.includes("incorporation")) return "incorporation";
  if (k.includes("id_document") || k.includes("identity")) return "id_document";
  if (k.includes("proof_of_address") || k.includes("address"))
    return "proof_of_address";
  if (k.includes("tax")) return "tax";
  return "other";
}

function evidenceKey(appId: string, taskKey: string) {
  return `${appId}::${taskKey}`;
}

export default function ClientEvidencePage() {
  const sb = useMemo(() => supabase(), []);
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [appIds, setAppIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<EvidenceTask[]>([]);
  const [evidenceByTask, setEvidenceByTask] = useState<Record<string, EvidenceRow>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ---- session bootstrap (no regressions) ----
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const { data } = await sb.auth.getUser();
        if (!mounted) return;
        setEmail(data.user?.email ?? null);
        setUserId(data.user?.id ?? null);
        setSessionReady(true);
      } catch {
        if (!mounted) return;
        setEmail(null);
        setUserId(null);
        setSessionReady(true);
      }
    }

    boot();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
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
      const u = userData.user;
      if (!u?.id) {
        setAppIds([]);
        setTasks([]);
        setEvidenceByTask({});
        setLoading(false);
        return;
      }

      // 1) find the client’s application(s)
      // NOTE: no schema changes; uses applicant_email + primary_contact_user_id if present.
      // If primary_contact_user_id is NULL in some rows, applicant_email still works.
      const { data: apps, error: appsErr } = await sb
        .from("onboarding_applications")
        .select("id, applicant_email, primary_contact_user_id")
        .or(`applicant_email.eq.${u.email},primary_contact_user_id.eq.${u.id}`)
        .order("submitted_at", { ascending: false })
        .limit(25);

      if (appsErr) throw appsErr;

      const ids = ((apps || []) as any[])
        .map((r) => String(r.id))
        .filter(Boolean);

      setAppIds(ids);

      if (ids.length === 0) {
        setTasks([]);
        setEvidenceByTask({});
        setLoading(false);
        return;
      }

      // 2) load tasks for those applications
      const { data: trows, error: tasksErr } = await sb
        .from("onboarding_provisioning_tasks")
        .select(
          "id,application_id,task_key,title,notes,required,channels,due_at,status,created_at"
        )
        .in("application_id", ids)
        .order("required", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (tasksErr) throw tasksErr;

      const tasksList = (trows as EvidenceTask[]) || [];
      setTasks(tasksList);

      // 3) load evidence rows for those applications and map them to tasks
      const { data: erows, error: evErr } = await sb
        .from("onboarding_evidence")
        .select(
          "id,application_id,kind,title,storage_bucket,storage_path,file_name,mime_type,size_bytes,uploaded_by,uploaded_at,is_verified,verified_by,verified_at,metadata"
        )
        .in("application_id", ids)
        .order("uploaded_at", { ascending: false })
        .limit(250);

      if (evErr) throw evErr;

      const evMap: Record<string, EvidenceRow> = {};
      const evList = (erows as EvidenceRow[]) || [];

      // Match evidence to task by canonical path prefix: `${appId}/${taskKey}/...`
      for (const ev of evList) {
        const ap = ev.application_id;
        if (!ap || !ev.storage_path) continue;

        for (const t of tasksList) {
          if (t.application_id !== ap) continue;
          const prefix = `${ap}/${t.task_key}/`;
          if (ev.storage_path.startsWith(prefix)) {
            const k = evidenceKey(ap, t.task_key);
            // keep the most recent (we ordered by uploaded_at desc already)
            if (!evMap[k]) evMap[k] = ev;
          }
        }
      }

      setEvidenceByTask(evMap);
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || "Failed to load evidence tasks");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sessionReady) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady]);

  const pending = tasks.filter((t) => statusTone(t.status) === "neutral");
  const requiredPending = pending.filter((t) => !!t.required);

  async function openEvidence(ev: EvidenceRow) {
    try {
      // signed URL so bucket can remain private
      const { data, error } = await sb.storage
        .from(ev.storage_bucket)
        .createSignedUrl(ev.storage_path, 60); // 60s is enough to open
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setErr(e?.message || "Failed to open evidence");
    }
  }

  async function onPickFile(task: EvidenceTask, file: File) {
    const k = evidenceKey(task.application_id, task.task_key);
    setBusyKey(k);
    setErr(null);

    try {
      const { data: userData } = await sb.auth.getUser();
      const u = userData.user;
      if (!u?.id) throw new Error("Session required");

      const bucket = "onboarding";
      const clean = safeFileName(file.name || "evidence");
      const path = `${task.application_id}/${task.task_key}/${clean}`;

      // 1) upload
      const { error: upErr } = await sb.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;

      // 2) insert evidence record (submission == upload + row)
      const insertRow = {
        application_id: task.application_id,
        kind: kindForTaskKey(task.task_key),
        title: task.title,
        storage_bucket: bucket,
        storage_path: path,
        file_name: clean,
        mime_type: file.type || null,
        size_bytes: file.size || null,
        uploaded_by: u.id,
        // uploaded_at default now()
        // is_verified default false
        // metadata default {}
      };

      const { error: insErr } = await sb.from("onboarding_evidence").insert(insertRow);
      if (insErr) throw insErr;

      // reload only (keeps contract stable)
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
                <div className="mt-2 text-[11px] text-zinc-500">
                  Applications in scope:{" "}
                  <span className="text-zinc-300">{appIds.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadAll()}
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

                  const k = evidenceKey(t.application_id, t.task_key);
                  const ev = evidenceByTask[k];
                  const uploading = busyKey === k;

                  const evTone =
                    ev?.is_verified ? "good" : ev ? "neutral" : "warn";

                  return (
                    <div key={t.id} className={cx("rounded-2xl border p-5", border, bg)}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                            {t.required ? "Required" : "Optional"} •{" "}
                            {(t.status || "PENDING").toUpperCase()}
                            {ev ? " • SUBMITTED" : " • NOT SUBMITTED"}
                            {ev?.is_verified ? " • VERIFIED" : ""}
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

                      {/* Evidence status panel */}
                      <div
                        className={cx(
                          "mt-4 rounded-xl border p-4",
                          evTone === "good"
                            ? "border-amber-300/20 bg-amber-950/10"
                            : evTone === "warn"
                            ? "border-red-500/25 bg-red-950/10"
                            : "border-white/10 bg-black/25"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                              Evidence
                            </div>
                            <div className="mt-2 text-sm text-zinc-300">
                              {ev?.is_verified
                                ? "Verified by authority."
                                : ev
                                ? "Submitted — pending verification."
                                : "Not submitted yet."}
                            </div>
                            {ev ? (
                              <div className="mt-2 text-xs text-zinc-500">
                                File:{" "}
                                <span className="text-zinc-300">
                                  {ev.file_name || ev.storage_path}
                                </span>
                                {" • "}Uploaded:{" "}
                                <span className="text-zinc-300">
                                  {fmtTs(ev.uploaded_at)}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {ev ? (
                              <button
                                type="button"
                                onClick={() => openEvidence(ev)}
                                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-amber-300/25 hover:bg-black/30"
                              >
                                Open
                              </button>
                            ) : null}

                            {/* Upload button: visible when missing, and still available as Replace when present (until verified) */}
                            <input
                              ref={(el) => {
                                fileInputRefs.current[k] = el;
                              }}
                              type="file"
                              className="hidden"
                              accept="application/pdf,image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                // reset input so same file can be re-selected
                                e.currentTarget.value = "";
                                if (!f) return;
                                onPickFile(t, f);
                              }}
                            />

                            <button
                              type="button"
                              disabled={uploading || !!ev?.is_verified}
                              onClick={() => fileInputRefs.current[k]?.click()}
                              className={cx(
                                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                                ev?.is_verified
                                  ? "cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500"
                                  : "bg-amber-300 text-black hover:bg-amber-200",
                                uploading ? "opacity-70" : ""
                              )}
                              title={
                                ev?.is_verified
                                  ? "Verified evidence is locked"
                                  : ev
                                  ? "Replace / upload a newer document"
                                  : "Upload evidence"
                              }
                            >
                              {uploading
                                ? "Uploading…"
                                : ev?.is_verified
                                ? "Locked"
                                : ev
                                ? "Replace"
                                : "Upload Evidence"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] text-zinc-500">
                          Submission = upload + registry entry in{" "}
                          <span className="text-zinc-300">onboarding_evidence</span>.
                        </div>
                      </div>

                      {/* Quiet footnote (keeps OS calm) */}
                      <div className="mt-3 text-[11px] text-zinc-600">
                        Uploads are stored in{" "}
                        <span className="text-zinc-400">onboarding</span> bucket
                        under:{" "}
                        <span className="text-zinc-400">
                          {t.application_id}/{t.task_key}/
                        </span>
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
