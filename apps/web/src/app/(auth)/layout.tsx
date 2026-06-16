"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/providers/locale-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-background)]">
      {/* Atmospheric gold and navy glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-[0.08] bg-[var(--color-accent)]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full blur-[120px] opacity-[0.05] bg-[var(--color-primary)]" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.04] bg-[var(--color-accent)]" />

      {/* Architectural grid lines (subtle) */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      />

      {/* Content card */}
      <div className="relative w-full max-w-md px-6">
        {/* Logo mark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-[var(--color-border)] mb-6 shadow-[var(--shadow-card)] relative overflow-hidden">
            {/* Inner gold glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-accent)_12%,transparent),transparent_70%)]" />
            <span className="relative font-bold text-2xl text-[var(--color-accent)]">
              YN
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-foreground)]">
              {t("app.title")}
            </h1>
            <span className="text-xl font-semibold text-[var(--color-accent)]">
              {t("app.chineseName")}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="w-6 h-px bg-[var(--color-border)]" />
            <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.25em] uppercase">
              Treasury Terminal
            </p>
            <div className="w-6 h-px bg-[var(--color-border)]" />
          </div>
        </div>

        {/* Auth form slot */}
        {children}
      </div>
    </div>
  );
}
