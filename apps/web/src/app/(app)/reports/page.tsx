"use client";

import { useLocale } from "@/providers/locale-provider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { FileBarChart, Download, FileText, ShieldCheck } from "lucide-react";

export default function ReportsPage() {
  const { t } = useLocale();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight text-[var(--color-foreground)]">
          {t("nav.reports")}
        </h1>
        <div className="flex items-center gap-2.5 mt-2">
          <div className="accent-rule" />
          <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
            Audit Logs &amp; Monthly Statements
          </p>
        </div>
      </div>

      {/* ── Placeholder card ── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-sm card-glow p-16 text-center corner-accent">
        {/* Icon cluster */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/8 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-accent)_10%,transparent),transparent_70%)]" />
            <FileBarChart className="w-6 h-6 text-[var(--color-accent)]/50 relative" />
          </div>
          <div className="w-0.5 h-8 rounded-full bg-[var(--color-border)]" />
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-blue)]/5 border border-[var(--color-accent-blue)]/8 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--color-accent-blue)]/40" />
          </div>
          <div className="w-0.5 h-8 rounded-full bg-[var(--color-border)]" />
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/8 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[var(--color-success)]/50" />
          </div>
        </div>

        {/* Description */}
        <div className="max-w-md mx-auto space-y-3">
          <h3 className="font-display text-base font-semibold text-[var(--color-foreground)] tracking-tight">
            {t("nav.reports")}
          </h3>
          <p className="text-[13px] text-[var(--color-muted)] leading-relaxed font-mono">
            Reporting system coming soon. Audit log queries and monthly statement exports will be available here.
          </p>
        </div>

        {/* Feature previews */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-10">
          <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/40 p-4 text-center">
            <Download className="w-5 h-5 text-[var(--color-accent)]/40 mx-auto mb-2" />
            <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.15em] uppercase">
              Monthly Statements
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/40 p-4 text-center">
            <FileText className="w-5 h-5 text-[var(--color-accent-blue)]/40 mx-auto mb-2" />
            <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.15em] uppercase">
              Audit Log Queries
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-background)]/40 p-4 text-center">
            <ShieldCheck className="w-5 h-5 text-[var(--color-success)]/40 mx-auto mb-2" />
            <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.15em] uppercase">
              Compliance Reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
