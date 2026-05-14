"use client";

import { useAccount } from "wagmi";
import { useLocale } from "@/providers/locale-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, CalendarDays, Percent, Layers, Activity } from "lucide-react";
import {
  useVaultTotalValue,
  useVaultUserShares,
  useVaultTotalShares,
  useStrategyInfo,
  formatUsdc,
} from "@/lib/web3/contracts";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLocale();

  const { data: totalValue } = useVaultTotalValue();
  const { data: userShares } = useVaultUserShares(address);
  const { data: totalShares } = useVaultTotalShares();
  const { data: strategy0 } = useStrategyInfo(BigInt(0));

  const tv = totalValue ? Number(formatUsdc(totalValue as bigint)) : 0;
  const shares = userShares ? Number(userShares as bigint) : 0;
  const ts = totalShares ? Number(totalShares as bigint) : 0;
  const userPosition = ts > 0 ? (shares * tv) / ts : 0;

  return (
    <div className="space-y-8 stagger-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-xs font-mono text-[var(--color-muted)] mt-1.5 tracking-widest uppercase">
            {t("dashboard.subtitle")} · {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
            <span className="live-dot" />
            <span className="text-xs font-mono text-[var(--color-success)] font-medium tracking-wide">CONNECTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--color-muted)]/10 border border-[var(--color-border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)]" />
            <span className="text-xs font-mono text-[var(--color-muted)] tracking-wide">WALLET OFFLINE</span>
          </div>
        )}
      </div>

      {/* Account Status */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 shimmer-hover">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs font-mono text-[var(--color-muted)] tracking-widest uppercase">
                {isConnected ? t("dashboard.walletConnected") : t("dashboard.connectWallet")}
              </p>
              <p className="text-sm text-[var(--color-foreground)] mt-0.5 font-mono">
                {isConnected ? `${address?.slice(0, 8)}...${address?.slice(-6)}` : t("dashboard.connectPrompt")}
              </p>
            </div>
          </div>
          {isConnected && (
            <div className="text-right">
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-widest uppercase">{t("dashboard.yourPosition")}</p>
              <p className="font-mono text-xl font-semibold text-[var(--color-foreground)]">
                ${userPosition.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.totalAssets")}
          value={`$${tv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          accent="amber"
        />
        <StatCard
          label={t("dashboard.yesterdayYield")}
          value="--"
          icon={CalendarDays}
          accent="emerald"
          muted
        />
        <StatCard
          label={t("dashboard.cumulativeYield")}
          value="--"
          icon={TrendingUp}
          accent="blue"
          muted
        />
        <StatCard
          label={t("dashboard.currentApy")}
          value="4.50%"
          icon={Percent}
          accent="amber"
        />
      </div>

      {/* Charts + Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.yieldTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border border-dashed border-[var(--color-border)]/50 rounded-lg">
              <div className="text-center">
                <Activity className="w-8 h-8 text-[var(--color-muted)]/30 mx-auto mb-2" />
                <p className="text-xs font-mono text-[var(--color-muted)]/50">{t("dashboard.chartsPlaceholder")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.assetAllocation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              {strategy0 ? (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] mx-auto mb-3 animate-spin" style={{ animationDuration: "8s" }} />
                  <p className="font-mono text-sm text-[var(--color-foreground)]">{t("dashboard.allocation100")}</p>
                </div>
              ) : (
                <p className="text-xs font-mono text-[var(--color-muted)]/50">{t("dashboard.allocationPlaceholder")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position / Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-[var(--color-background)]/50">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-medium">{t("dashboard.vaultPosition")}</p>
                    <p className="text-[11px] font-mono text-[var(--color-muted)]">
                      {shares.toLocaleString()} {t("dashboard.shares")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-[var(--color-foreground)]">
                    ${userPosition.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-success)] uppercase tracking-wider">Active</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs font-mono text-[var(--color-muted)]">
                {t("dashboard.noWallet")} — {t("dashboard.connectToBegin")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Stat Card (Internal) ── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  muted,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  accent: "amber" | "blue" | "emerald";
  muted?: boolean;
}) {
  const colors = {
    amber: { dot: "bg-[var(--color-accent)]", text: "text-[var(--color-accent)]", bg: "bg-[var(--color-accent)]/5" },
    blue: { dot: "bg-[var(--color-accent-blue)]", text: "text-[var(--color-accent-blue)]", bg: "bg-[var(--color-accent-blue)]/5" },
    emerald: { dot: "bg-[var(--color-success)]", text: "text-[var(--color-success)]", bg: "bg-[var(--color-success)]/5" },
  };

  const c = colors[accent];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className={`text-[10px] font-mono uppercase tracking-[0.15em] ${c.text} ${c.bg} px-2 py-0.5 rounded-full`}>
            {label}
          </span>
          <Icon className={cn("w-4 h-4", muted ? "text-[var(--color-muted)]/40" : c.text)} />
        </div>
        <p className={cn("font-mono text-2xl font-semibold tracking-tight", muted && "text-[var(--color-muted)]/50")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function cn(...args: (string | false | undefined | null)[]) {
  return args.filter(Boolean).join(" ");
}
