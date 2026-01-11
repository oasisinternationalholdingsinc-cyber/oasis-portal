// app/auth/callback/page.tsx
export const dynamic = "force-dynamic";

import CallbackClient from "./callback.client";

export default function AuthCallbackPage() {
  return <CallbackClient />;
}
