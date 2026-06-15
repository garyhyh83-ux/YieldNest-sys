"use client";

import { useLocale } from "@/providers/locale-provider";
import type { TranslationKey } from "@/lib/i18n/translations";

export default function ReportsPage() {
  const { t } = useLocale();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
          {t("nav.reports")}
        </h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Monthly statements, audit logs, and compliance reports
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 p-12 text-center">
        <p className="text-[var(--color-muted)] text-sm">
          Reporting system coming soon. Audit log queries and monthly statement exports will be available here.
        </p>
      </div>
    </div>
  );
}
