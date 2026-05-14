"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  CheckSquare,
  FileText,
  Users,
  Settings,
  FlaskConical,
  Globe,
  Hexagon,
} from "lucide-react";

const navItems: {
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
  enabled: boolean;
}[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/deposit", labelKey: "nav.deposit", icon: ArrowDownToLine, enabled: true },
  { href: "/withdraw", labelKey: "nav.withdraw", icon: ArrowUpFromLine, enabled: true },
  { href: "/strategies", labelKey: "nav.strategies", icon: TrendingUp, enabled: true },
  { href: "/approvals", labelKey: "nav.approvals", icon: CheckSquare, enabled: false },
  { href: "/reports", labelKey: "nav.reports", icon: FileText, enabled: false },
  { href: "/team", labelKey: "nav.team", icon: Users, enabled: false },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, enabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isDemo, user } = useAuth();
  const { t, locale, toggleLocale } = useLocale();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-xl flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Hexagon className="w-8 h-8 text-[var(--color-accent)] rotate-90" strokeWidth={1.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#080c14]">
              YN
            </span>
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-wide">{t("app.title")}</span>
            <p className="text-[10px] text-[var(--color-muted)] tracking-widest uppercase">Treasury Terminal</p>
          </div>
        </div>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/15 flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--color-accent)]">
              {t("demo.badge")}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] truncate">{user?.email}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.enabled ? item.href : "#"}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                !item.enabled && "opacity-30 cursor-not-allowed select-none",
                isActive &&
                  item.enabled &&
                  "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20",
                !isActive &&
                  item.enabled &&
                  "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/[0.03]"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive && item.enabled && "text-[var(--color-accent)]")} />
              <span>{t(item.labelKey)}</span>
              {!item.enabled && (
                <span className="ml-auto text-[10px] bg-white/[0.03] px-2 py-0.5 rounded-full font-mono text-[var(--color-muted)]">
                  {t("nav.soon")}
                </span>
              )}
              {isActive && item.enabled && (
                <div className="ml-auto w-1 h-4 rounded-full bg-[var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Language toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggleLocale}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/[0.03] transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{t("lang.label")}</span>
          <span className="ml-auto text-[11px] bg-white/[0.04] px-2.5 py-0.5 rounded-full font-mono font-medium text-[var(--color-muted-light)]">
            {t("lang.switch")}
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--color-border)]/50">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-[10px] font-mono text-[var(--color-muted)] tracking-wider uppercase">
            Live · {t("app.version")}
          </span>
        </div>
      </div>
    </aside>
  );
}
