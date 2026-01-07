// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

/**
 * iOS / Mobile-native viewport handling
 * - viewport-fit=cover enables safe-area insets (notch / home bar)
 * - handled by Next.js App Router correctly
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Oasis Digital Parliament – Governance OS",
  description: "Oasis OS • Digital Parliament Ledger & CI Suite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-[#020617] text-slate-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
