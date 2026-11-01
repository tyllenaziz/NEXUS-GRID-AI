import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusGrid Ops | Admin Console",
  description: "Internal data management for NexusGrid",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL: The HTML and BODY tags must touch on the same line to prevent whitespace hydration errors
  return (
    <html lang="en" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>{children}</body></html>
  );
}