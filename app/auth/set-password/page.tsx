"use client";

import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseClient";

export default function SetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setStatus(null);
    if (!pw || pw.length < 8) return setStatus("Password must be at least 8 characters.");
    if (pw !== pw2) return setStatus("Passwords do not match.");

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);

    if (error) return setStatus(error.message);

    setStatus("Password set. Account activated.");
    // redirect wherever you want after success
    window.location.href = "/";
  };

  return (
    <div style={{ padding: 24, color: "white", maxWidth: 420 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Create your password</h1>

      <input
        type="password"
        placeholder="New password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={submit} disabled={busy} style={{ padding: "10px 14px" }}>
        {busy ? "Saving…" : "Set password"}
      </button>

      {status && <div style={{ marginTop: 12, opacity: 0.9 }}>{status}</div>}
    </div>
  );
}
