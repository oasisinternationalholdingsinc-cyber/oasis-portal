// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Oasis Portal — Public Authority Gateway",
  description: "Institutional gateway for verification, certificates, and onboarding.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="oasis-root">
        {children}
      </body>
    </html>
  );
}
