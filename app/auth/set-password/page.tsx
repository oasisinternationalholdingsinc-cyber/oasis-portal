"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

function isUuidLike(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

async function resolveLatestAppIdByEmail(email: string) {
  const { data } = await supabase
    .from("onboarding_applications")
    .select("id")
    .ilike("applicant_email", email)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export default function SetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const id =
      url.searchParams.get("app_id") ||
      sessionStorage.getItem("oasis_app_id");

    if (id) {
      setAppId(id);
      sessionStorage.setItem("oasis_app_id", id);
    }
  }, []);

  const appIdOk = useMemo(() => !!(appId && isUuidLike(appId)), [appId]);

  const submit = async () => {
    setStatus(null);

    if (pw.length < 8) return setStatus("Password must be at least 8 characters.");
    if (pw !== pw2) return setStatus("Passwords do not match.");

    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return setStatus("Session expired. Re-open the invite email.");
      }

      const { error: updErr } = await supabase.auth.updateUser({
        password: pw,
      });
      if (updErr) return setStatus(updErr.message);

      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      const email = userRes?.user?.email;

      if (!userId || !email) return setStatus("Session invalid.");

      const effectiveAppId =
        appIdOk && appId
          ? appId
          : await resolveLatestAppIdByEmail(email);

      if (!effectiveAppId)
        return setStatus("Provisioning context unresolved.");

      await supabase.rpc("admissions_complete_provisioning", {
        p_application_id: effectiveAppId,
        p_user_id: userId,
      });

      window.location.href = "/client";
    } catch (e: any) {
      setStatus(e?.message || "Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/40 p-6">
        <h1 className="mb-4 text-lg font-semibold text-white">
          Create your password
        </h1>

        <input
          type="password"
          placeholder="New password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
        />

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-lg bg-amber-300 py-2 font-semibold text-black disabled:opacity-60"
        >
          {busy ? "Saving…" : "Set password"}
        </button>

        {status && (
          <div className="mt-4 text-sm text-white/80">{status}</div>
        )}
      </div>
    </main>
  );
}
