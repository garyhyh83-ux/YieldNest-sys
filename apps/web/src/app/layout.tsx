import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YieldNest — Enterprise Stablecoin Yield",
  description: "Enterprise-grade stablecoin yield aggregator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders fontClassName={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      {children}
    </AppProviders>
  );
}
