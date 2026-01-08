"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true } }
);

export default function SetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return pw.length >= 8 && pw === pw2 && !busy;
  }, [pw, pw2, busy]);

  const submit = async () => {
    setStatus(null);

    if (pw.length < 8) return setStatus("Password must be at least 8 characters.");
    if (pw !== pw2) return setStatus("Passwords do not match.");

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);

    if (error) return setStatus(error.message);

    setStatus("Password set. Account activated.");
    window.location.href = "/";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        color: "white",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 8,
          }}
        >
          Oasis Portal
        </div>

        <h1 style={{ fontSize: 18, marginBottom: 14, opacity: 0.92 }}>
          Create your password
        </h1>

        <input
          type="password"
          placeholder="New password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(10,18,30,.6)",
            color: "white",
            outline: "none",
          }}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 14,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(10,18,30,.6)",
            color: "white",
            outline: "none",
          }}
        />

        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,214,128,.25)",
            background: canSubmit
              ? "rgba(255,214,128,.92)"
              : "rgba(255,214,128,.22)",
            color: canSubmit ? "#05070c" : "rgba(255,255,255,.6)",
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "Saving…" : "Set password"}
        </button>

        {status && (
          <div style={{ marginTop: 12, opacity: 0.85, fontSize: 13 }}>
            {status}
          </div>
        )}

        <div style={{ marginTop: 18, opacity: 0.55, fontSize: 12 }}>
          If you did not expect this invitation, you may close this page.
        </div>
      </div>
    </div>
  );
}
