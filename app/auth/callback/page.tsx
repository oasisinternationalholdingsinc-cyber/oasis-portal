"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseClient";

function getHashParams() {
  // Supabase often returns tokens in the URL hash:
  // #access_token=...&refresh_token=...&expires_in=...&token_type=bearer&type=invite
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const q = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return {
    access_token: q.get("access_token"),
    refresh_token: q.get("refresh_token"),
    type: q.get("type"),
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing secure access…");

  useEffect(() => {
    (async () => {
      const { access_token, refresh_token } = getHashParams();

      if (!access_token || !refresh_token) {
        setMsg("Missing session token. Please re-open the invite link from your email.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        setMsg(`Session error: ${error.message}`);
        return;
      }

      // Now you are authenticated—send them to set password screen
      router.replace("/auth/set-password");
    })();
  }, [router]);

  return (
    <div style={{ padding: 24, color: "white" }}>
      {msg}
    </div>
  );
}
