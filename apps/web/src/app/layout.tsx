import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <AppProviders fontClassName={`${bodyFont.variable} ${monoFont.variable}`}>
      {children}
    </AppProviders>
  );
}
