import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Vault — Secure Credential Vault for AI Agents",
  description:
    "Connect your accounts safely. Your AI agents get scoped, time-limited access. You stay in control. By Signal & Structure AI.",
  openGraph: {
    title: "Signal Vault",
    description: "Secure credential vault for AI agents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
