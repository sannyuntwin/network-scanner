import type { Metadata } from "next";
import { Share_Tech_Mono } from "next/font/google";

import "leaflet/dist/leaflet.css";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech",
});

export const metadata: Metadata = {
  title: "Network Scanner Dashboard",
  description: "Next.js dashboard for the local network scanner backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={shareTechMono.variable}>{children}</body>
    </html>
  );
}
