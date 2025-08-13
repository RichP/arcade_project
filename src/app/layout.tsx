import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SidebarNav from "@/components/SidebarNav";
import UIEffects from "@/components/UIEffects";
import Toaster from "@/components/Toaster";
import CookieConsent from "@/components/CookieConsent";
import PWA from "@/components/PWA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Arcade",
    template: "%s • Arcade",
  },
  description: "Play featured and classic web games in a sleek dark UI.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/vercel.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/vercel.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en">
  <body className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} antialiased`}>
  {/* Accessible skip link for keyboard users */}
  <a href="#main-content" className="skip-link">Skip to content</a>
  {/* Subtle background layers: pattern (back) + mesh (front) */}
  <div aria-hidden className="pattern-bg" />
  <div aria-hidden className="mesh-bg" />
  <Suspense fallback={<div className="h-16" />}> 
          <NavBar />
        </Suspense>
        <Suspense fallback={null}>
          <SidebarNav />
        </Suspense>
        <main
          id="main-content"
          className="py-6 pr-4 sm:pr-6 lg:pr-8"
          style={{ paddingLeft: "calc(var(--sidebar-w, 224px) + 1rem)" }}
        >
          {children}
        </main>
        {/* Client-only UI helpers must render inside <body> */}
        <UIEffects />
        <Toaster />
  <CookieConsent />
        <PWA />
      </body>
    </html>
  );
}
