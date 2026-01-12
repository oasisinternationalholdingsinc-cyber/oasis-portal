// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_#020c24_0%,_#020617_45%,_#000_100%)] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
