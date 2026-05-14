"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/providers/locale-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[var(--color-background)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-[var(--color-accent)]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-5 bg-[var(--color-accent-blue)]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] mb-5 shadow-lg shadow-black/20">
            <span className="font-display font-bold text-xl text-[var(--color-accent)]">YN</span>
          </div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-foreground)]">
            {t("app.title")}
          </h1>
          <p className="text-xs font-mono text-[var(--color-muted)] mt-2 tracking-widest uppercase">
            Treasury Terminal
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
