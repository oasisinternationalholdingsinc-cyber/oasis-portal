// app/auth/callback/page.tsx
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const CallbackClient = dynamicImport(() => import("./callback.client"), {
  ssr: false,
});

export default function AuthCallbackPage() {
  return <CallbackClient />;
}
