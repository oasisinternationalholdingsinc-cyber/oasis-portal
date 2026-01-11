"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// ✅ supabaseBrowser is already a client, NOT a function
const supabase = supabaseBrowser;

function getHashParams() {
  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";
  const q = new URLSearchParams(hash);
  return {
    access_token: q.get("access_token"),
    refresh_token: q.get("refresh_token"),
    type: q.get("type"),
    app_id: q.get("app_id") || q.get("application_id"),
  };
}

function getQueryParams() {
  const url = new URL(window.location.href);
  return {
    code: url.searchParams.get("code"),
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
    app_id: url.searchParams.get("app_id") || url.searchParams.get("application_id"),
    error: url.searchParams.get("error"),
    error_code: url.searchParams.get("error_code"),
    error_description: url.searchParams.get("error_description"),
  };
}

export default function CallbackClient() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing secure access…");

  useEffect(() => {
    (async () => {
      // If Supabase already redirected with an error (expired link, etc) show it clearly.
      const q0 = getQueryParams();
      if (q0.error || q0.error_code) {
        const desc = q0.error_description || q0.error || q0.error_code;
        setMsg(desc || "Invite/reset link error. Please request a fresh link.");
        return;
      }

      // If session already exists, just forward.
      const existing = await supabase.auth.getSession();
      if (existing.data?.session) {
        const appId = q0.app_id || getHashParams().app_id || null;
        const dest = appId
          ? `/auth/set-password?app_id=${encodeURIComponent(appId)}`
          : "/auth/set-password";
        router.replace(dest);
        return;
      }

      const q = getQueryParams();
      const h = getHashParams();

      const appId = q.app_id || h.app_id || null;
      const toSetPassword = () => {
        const dest = appId
          ? `/auth/set-password?app_id=${encodeURIComponent(appId)}`
          : "/auth/set-password";
        router.replace(dest);
      };

      // 1) PKCE code flow: ?code=...
      if (q.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(q.code);
        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }

        // Clean URL (remove code, keep app_id)
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());

        toSetPassword();
        return;
      }

      // 2) OTP flow: ?token_hash=...&type=invite|recovery|magiclink
      // (sometimes comes in query, sometimes hash)
      const token_hash = q.token_hash || h.token_hash;
      const type = (q.type || h.type || "").trim() as any;

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }

        // Clean URL (remove otp params)
        const url = new URL(window.location.href);
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", url.toString());

        toSetPassword();
        return;
      }

      // 3) Legacy implicit hash: #access_token=...&refresh_token=...
      if (h.access_token && h.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: h.access_token,
          refresh_token: h.refresh_token,
        });
        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }

        // Remove hash tokens
        const url = new URL(window.location.href);
        window.history.replaceState({}, "", url.origin + url.pathname + url.search);

        toSetPassword();
        return;
      }

      setMsg("Missing session token. Please re-open the invite/reset email link from your inbox.");
    })();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 700, color: "white", opacity: 0.9, fontFamily: "system-ui" }}>
        {msg}
      </div>
    </div>
  );
}
