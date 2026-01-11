"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

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

export default function CallbackClient() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing secure access…");

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);

      const appId =
        url.searchParams.get("app_id") ||
        url.searchParams.get("application_id") ||
        null;

      const redirectToSetPassword = (id: string | null) => {
        const dest = id
          ? `/auth/set-password?app_id=${encodeURIComponent(id)}`
          : "/auth/set-password";
        router.replace(dest);
      };

      // 1️⃣ PKCE flow (?code=...)
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(`Session error: ${error.message}`);
          return;
        }
        redirectToSetPassword(appId);
        return;
      }

      // 2️⃣ Legacy hash token flow
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

        redirectToSetPassword(appId || hashAppId || null);
        return;
      }

      setMsg("Missing session token. Please open the invite link directly.");
    })();
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-sm text-white/80">{msg}</div>
    </div>
  );
}
