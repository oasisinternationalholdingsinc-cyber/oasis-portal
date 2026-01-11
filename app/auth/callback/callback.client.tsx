"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

type HashTokens = { access_token: string; refresh_token: string; app_id?: string | null };

function readHashTokens(): HashTokens | null {
  const hash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash || "";

  const q = new URLSearchParams(hash);

  const access_token = q.get("access_token");
  const refresh_token = q.get("refresh_token");
  const app_id = q.get("app_id") || q.get("application_id");

  if (access_token && refresh_token) return { access_token, refresh_token, app_id };
  return null;
}

export default function CallbackClient() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing secure access…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // Carry app_id forward so Set-Password can SHOW it.
        const appId =
          url.searchParams.get("app_id") ||
          url.searchParams.get("application_id") ||
          null;

        const toSetPassword = (id: string | null) => {
          const dest = id
            ? `/auth/set-password?app_id=${encodeURIComponent(id)}`
            : "/auth/set-password";
          router.replace(dest);
        };

        // 1) PKCE code flow (newer)
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg(`Session error: ${error.message}`);
            return;
          }
          toSetPassword(appId);
          return;
        }

        // 2) token_hash flow (common Supabase invite/recovery)
        const token_hash = url.searchParams.get("token_hash");
        const type = (url.searchParams.get("type") || "") as any;
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ type, token_hash });
          if (error) {
            setMsg(`Session error: ${error.message}`);
            return;
          }
          toSetPassword(appId);
          return;
        }

        // 3) access_token/refresh_token in hash (older)
        const ht = readHashTokens();
        if (ht?.access_token && ht?.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: ht.access_token,
            refresh_token: ht.refresh_token,
          });

          if (error) {
            setMsg(`Session error: ${error.message}`);
            return;
          }

          toSetPassword(appId || ht.app_id || null);
          return;
        }

        setMsg("Missing session token. Please re-open the invite link from your email.");
      } catch (e: any) {
        setMsg(e?.message || "Callback failed.");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen text-zinc-100 bg-black flex items-center justify-center px-6">
      <div className="max-w-2xl text-center text-sm text-zinc-200/90">{msg}</div>
    </div>
  );
}
