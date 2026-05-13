"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  CheckSquare,
  FileText,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/deposit", label: "Deposit", icon: ArrowDownToLine, enabled: false },
  { href: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine, enabled: false },
  { href: "/strategies", label: "Strategies", icon: TrendingUp, enabled: false },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, enabled: false },
  { href: "/reports", label: "Reports", icon: FileText, enabled: false },
  { href: "/team", label: "Team", icon: Users, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm">
            YN
          </div>
          <span className="font-semibold text-lg">YieldNest</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.enabled ? item.href : "#"}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                !item.enabled && "opacity-40 cursor-not-allowed",
                isActive && item.enabled && "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
                !isActive && item.enabled && "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/5",
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {!item.enabled && (
                <span className="ml-auto text-[10px] bg-white/5 px-2 py-0.5 rounded">Soon</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="text-xs text-[var(--color-muted)]">
          YieldNest v0.1.0 — Phase 0
        </div>
      </div>
    </aside>
  );
}
