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
  Shield,
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
  { href: "/approvals", labelKey: "nav.approvals", icon: CheckSquare, enabled: true },
  { href: "/policies", labelKey: "nav.policies", icon: Shield, enabled: true },
  { href: "/reports", labelKey: "nav.reports", icon: FileText, enabled: true },
  { href: "/team", labelKey: "nav.team", icon: Users, enabled: false },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, enabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isDemo, user } = useAuth();
  const { t, locale, toggleLocale } = useLocale();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-xl flex flex-col z-30 card-vault rounded-none">
      {/* Logo — architectural treatment */}
      <div className="h-16 flex items-center px-5 border-b border-[var(--color-border)]/60 relative overflow-hidden">
        {/* Subtle gold wash behind logo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,color-mix(in_srgb,var(--color-accent)_8%,transparent),transparent_70%)]" />
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <Hexagon className="w-8 h-8 text-[var(--color-accent)] rotate-90" strokeWidth={1.2} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1a1a16]">
              YN
            </span>
          </div>
          <div>
            <span className="font-display font-bold text-[15px] tracking-tight text-[var(--color-foreground)]">
              {t("app.title")}
            </span>
            <p className="text-[10px] text-[var(--color-muted)] tracking-[0.2em] uppercase font-mono">
              Treasury Terminal
            </p>
          </div>
        </div>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-[var(--color-accent)]/4 border border-[var(--color-accent)]/12 flex items-center gap-2.5 backdrop-blur-sm">
          <FlaskConical className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--color-accent)] tracking-wide">
              {t("demo.badge")}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] truncate font-mono">{user?.email}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.enabled ? item.href : "#"}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                !item.enabled && "opacity-25 cursor-not-allowed select-none",
                isActive && item.enabled && [
                  "bg-[var(--color-accent)]/8 text-[var(--color-accent)]",
                  "border border-[var(--color-accent)]/15",
                  // Gold indicator bar on active item
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-r-full before:bg-[var(--color-accent)]",
                ],
                !isActive && item.enabled && [
                  "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                  "hover:bg-[var(--color-foreground)]/3",
                ]
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive && item.enabled
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)] group-hover:text-[var(--color-muted-light)]"
                )}
              />
              <span>{t(item.labelKey)}</span>
              {!item.enabled && (
                <span className="ml-auto text-[10px] bg-[var(--color-foreground)]/3 px-2 py-0.5 rounded-full font-mono text-[var(--color-muted)]">
                  {t("nav.soon")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="px-5">
        <div className="border-t border-[var(--color-border)]/40" />
      </div>

      {/* Language toggle */}
      <div className="px-3 py-2">
        <button
          onClick={toggleLocale}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-foreground)]/3 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{t("lang.label")}</span>
          <span className="ml-auto text-[11px] bg-[var(--color-foreground)]/4 px-2.5 py-0.5 rounded-full font-mono font-medium text-[var(--color-muted-light)]">
            {t("lang.switch")}
          </span>
        </button>
      </div>

      {/* Footer — live indicator */}
      <div className="px-5 py-3 border-t border-[var(--color-border)]/30">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.18em] uppercase">
            Live · {t("app.version")}
          </span>
        </div>
      </div>
    </aside>
  );
}
