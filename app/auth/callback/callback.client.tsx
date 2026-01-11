// app/auth/callback/callback.client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// ✅ Works whether supabaseBrowser is exported as a function OR a pre-built client (prevents "not callable" regression)
const supabase: any = (() => {
  const maybe: any = supabaseBrowser as any;
  return typeof maybe === "function" ? maybe() : maybe;
})();

type Parsed = {
  code: string | null;
  token_hash: string | null;
  type: string | null;
  access_token: string | null;
  refresh_token: string | null;
  app_id: string | null;
  error: string | null;
  error_code: string | null;
  error_description: string | null;
};

function getQueryParams(): Parsed {
  if (typeof window === "undefined") {
    return {
      code: null,
      token_hash: null,
      type: null,
      access_token: null,
      refresh_token: null,
      app_id: null,
      error: null,
      error_code: null,
      error_description: null,
    };
  }

  const url = new URL(window.location.href);
  return {
    code: url.searchParams.get("code"),
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
    access_token: url.searchParams.get("access_token"),
    refresh_token: url.searchParams.get("refresh_token"),
    app_id: url.searchParams.get("app_id") || url.searchParams.get("application_id"),
    error: url.searchParams.get("error"),
    error_code: url.searchParams.get("error_code"),
    error_description: url.searchParams.get("error_description"),
  };
}

function getHashParams(): Parsed {
  if (typeof window === "undefined") {
    return {
      code: null,
      token_hash: null,
      type: null,
      access_token: null,
      refresh_token: null,
      app_id: null,
      error: null,
      error_code: null,
      error_description: null,
    };
  }

  const raw = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";
  const q = new URLSearchParams(raw);

  return {
    code: q.get("code"),
    token_hash: q.get("token_hash"),
    type: q.get("type"),
    access_token: q.get("access_token"),
    refresh_token: q.get("refresh_token"),
    app_id: q.get("app_id") || q.get("application_id"),
    error: q.get("error"),
    error_code: q.get("error_code"),
    error_description: q.get("error_description"),
  };
}

function buildSetPasswordUrl(appId: string | null) {
  return appId ? `/auth/set-password?app_id=${encodeURIComponent(appId)}` : "/auth/set-password";
}

export default function CallbackClient() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing secure access…");

  useEffect(() => {
    (async () => {
      const q = getQueryParams();
      const h = getHashParams();

      // 0) show explicit link errors (expired, already used, etc.)
      const linkErr = q.error || h.error || q.error_code || h.error_code;
      if (linkErr) {
        const desc =
          q.error_description || h.error_description || q.error || h.error || q.error_code || h.error_code;
        setMsg(desc || "Invite/reset link error. Please request a fresh link.");
        return;
      }

      const appId = q.app_id || h.app_id || null;

      // 1) if session already exists, just forward
      const existing = await supabase.auth.getSession();
      if (existing?.data?.session) {
        router.replace(buildSetPasswordUrl(appId));
        return;
      }

      // 2) PKCE code flow: ?code=...
      const code = q.code || h.code;
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }

        // clean URL: remove code only (keep app_id)
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());

        router.replace(buildSetPasswordUrl(appId));
        return;
      }

      // 3) OTP flow: ?token_hash=...&type=invite|recovery|magiclink (query OR hash)
      const token_hash = q.token_hash || h.token_hash;
      const type = (q.type || h.type || "").trim() as any;

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }

        // clean URL: remove otp params (keep app_id)
        const url = new URL(window.location.href);
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", url.toString());

        router.replace(buildSetPasswordUrl(appId));
        return;
      }

      // 4) legacy implicit tokens: #access_token=...&refresh_token=...
      if (h.access_token && h.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: h.access_token,
          refresh_token: h.refresh_token,
        });

        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }

        // remove hash entirely, keep query (app_id)
        const url = new URL(window.location.href);
        window.history.replaceState({}, "", url.origin + url.pathname + url.search);

        router.replace(buildSetPasswordUrl(appId));
        return;
      }

      setMsg("Missing session token. Please re-open the invite/reset email link from your inbox.");
    })();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 760, color: "white", opacity: 0.9, fontFamily: "system-ui" }}>{msg}</div>
    </div>
  );
}
