// v: 2026-06-01 07:08 UTC
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PA Intelligence | Prior Authorization Analytics",
  description: "Prior Authorization policy extraction and access score analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
