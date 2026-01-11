"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const appId = params.get("app_id");

      if (!code) {
        console.error("Missing auth code");
        return;
      }

      const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Session exchange failed:", error.message);
        return;
      }

      // ✅ Session is now set
      if (appId) {
        router.replace(`/auth/set-password?app_id=${appId}`);
      } else {
        router.replace("/");
      }
    };

    run();
  }, [params, router]);

  return (
    <div className="w-full h-screen flex items-center justify-center text-white/70">
      Completing secure sign-in…
    </div>
  );
}
