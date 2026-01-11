"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

function getHashParams() {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const q = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return {
    access_token: q.get("access_token"),
    refresh_token: q.get("refresh_token"),
    app_id: q.get("app_id") || q.get("application_id"),
  };
}

export default function CallbackClient() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing secure access…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // Carry app_id forward for set-password
        const appId =
          url.searchParams.get("app_id") ||
          url.searchParams.get("application_id") ||
          null;

        const toSetPassword = (app_id: string | null) => {
          const dest = app_id
            ? `/auth/set-password?app_id=${encodeURIComponent(app_id)}`
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

        // 2) token_hash + type flow (common Supabase invite/recovery)
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

        // 3) Hash token flow (older)
        const { access_token, refresh_token, app_id: hashAppId } = getHashParams();
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            setMsg(`Session error: ${error.message}`);
            return;
          }

          toSetPassword(appId || hashAppId || null);
          return;
        }

        setMsg("Missing session token. Please re-open the invite/reset link from your email.");
      } catch (e: any) {
        setMsg(e?.message || "Callback failed.");
      }
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
