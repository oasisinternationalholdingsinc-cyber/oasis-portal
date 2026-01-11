// app/auth/callback/page.tsx
import CallbackClient from "./callback.client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return <CallbackClient />;
}
