"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * /auth/callback
 * SAFETY NET ONLY.
 *
 * ✅ Never tries to “be smart” or create its own session.
 * ✅ Simply forwards *everything* (code / token_hash+type / hash tokens / errors / app_id)
 *    to /auth/set-password, where the real establishSessionFromLink() lives.
 *
 * This prevents regressions like:
 * - otp_expired on callback
 * - “missing session token” loops
 * - losing app_id
 */

function pickAppId(url: URL) {
  return (
    url.searchParams.get("app_id") ||
    url.searchParams.get("application_id") ||
    null
  );
}

function buildSetPasswordUrl(current: URL) {
  const appId = pickAppId(current);

  // Start with base
  const dest = new URL(`${current.origin}/auth/set-password`);

  // Carry app_id (canonical)
  if (appId) dest.searchParams.set("app_id", appId);

  // Carry any auth params Supabase might provide (do NOT strip)
  // - PKCE flow: ?code=...
  // - OTP flow: ?token_hash=...&type=invite|recovery|magiclink
  // - Error flow: ?error=...&error_code=...&error_description=...
  const passThroughKeys = [
    "code",
    "token_hash",
    "type",
    "error",
    "error_code",
    "error_description",
  ];

  for (const k of passThroughKeys) {
    const v = current.searchParams.get(k);
    if (v) dest.searchParams.set(k, v);
  }

  // Carry hash tokens if present (#access_token=...&refresh_token=...)
  // Keep the hash exactly — set-password can parse it.
  if (current.hash && current.hash.length > 1) {
    dest.hash = current.hash;
  }

  return dest.toString();
}

function humanizeError(url: URL) {
  const err = url.searchParams.get("error");
  const code = url.searchParams.get("error_code");
  const desc = url.searchParams.get("error_description");
  if (!err && !code && !desc) return null;

  const lower = `${err || ""} ${code || ""} ${desc || ""}`.toLowerCase();
  if (lower.includes("otp_expired") || lower.includes("expired")) {
    return "Invite/reset link expired. Please request a new email and open the newest link directly.";
  }

  return desc || err || code;
}

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Finalizing secure access…");

  const { dest, errorText } = useMemo(() => {
    const url = new URL(window.location.href);
    return {
      dest: buildSetPasswordUrl(url),
      errorText: humanizeError(url),
    };
  }, []);

  useEffect(() => {
    // If Supabase already told us it’s expired/denied, don’t loop forever.
    // Still forward to set-password (it will show the same error + “no token”),
    // but we display a human message for a second so it doesn’t feel like a blank bounce.
    if (errorText) {
      setMsg(errorText);
      const t = setTimeout(() => {
        window.location.replace(dest);
      }, 650);
      return () => clearTimeout(t);
    }

    // Normal path: forward immediately, preserving params + hash.
    window.location.replace(dest);
  }, [dest, errorText]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Oasis Portal
          </div>
          <div className="mt-2 text-lg font-semibold">Auth callback</div>
          <div className="mt-3 text-sm text-zinc-300">{msg}</div>

          <div className="mt-5 text-xs text-zinc-500">
            Redirecting to set-password…
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.location.replace(dest)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
