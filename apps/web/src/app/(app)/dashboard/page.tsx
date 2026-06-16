"use client";

import { useAccount } from "wagmi";
import { useLocale } from "@/providers/locale-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, CalendarDays, Percent, Layers, Activity, Hexagon } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import {
  useVaultTotalValue,
  useVaultUserShares,
  useVaultTotalShares,
  useStrategyInfo,
  formatUsdc,
} from "@/lib/web3/contracts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { t } = useLocale();

  const connected = mounted && isConnected;

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
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-[var(--color-foreground)]">
            {t("dashboard.title")}
          </h1>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="accent-rule" />
            <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
              {t("dashboard.subtitle")}{mounted ? ` · ${new Date().toISOString().slice(0, 10)}` : ""}
            </p>
          </div>
        </div>

        {/* Connection badge */}
        {connected ? (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[var(--color-success)]/8 border border-[var(--color-success)]/15 backdrop-blur-sm">
            <span className="live-dot !m-0" />
            <span className="text-[11px] font-mono text-[var(--color-success)] font-medium tracking-[0.15em] uppercase">
              Connected
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[var(--color-muted)]/6 border border-[var(--color-border)]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)]/50" />
            <span className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.15em] uppercase">
              Wallet Offline
            </span>
          </div>
        )}
      </div>

      {/* ── Account Status ── */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 shimmer-hover corner-accent card-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/15 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-accent)_15%,transparent),transparent_70%)]" />
              <Activity className="w-5 h-5 text-[var(--color-accent)] relative" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.18em] uppercase">
                {connected ? t("dashboard.walletConnected") : t("dashboard.connectWallet")}
              </p>
              <p className="text-sm text-[var(--color-foreground)] mt-0.5 font-mono tracking-wide">
                {connected ? `${address?.slice(0, 8)}...${address?.slice(-6)}` : t("dashboard.connectPrompt")}
              </p>
            </div>
          </div>
          {connected && (
            <div className="text-right">
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.18em] uppercase">
                {t("dashboard.yourPosition")}
              </p>
              <p className="font-mono text-xl font-semibold text-[var(--color-foreground)] tracking-tight">
                ${userPosition.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.totalAssets")}
          value={`$${tv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          accent="gold"
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
          accent="gold"
        />
      </div>

      {/* ── Charts + Allocation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yield Trend */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>{t("dashboard.yieldTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)]/30">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/4 border border-[var(--color-accent)]/10 flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6 text-[var(--color-accent)]/25" />
                </div>
                <p className="text-[11px] font-mono text-[var(--color-muted)]/40 tracking-wider uppercase">
                  {t("dashboard.chartsPlaceholder")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocation */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>{t("dashboard.assetAllocation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              {strategy0 ? (
                <div className="text-center space-y-4">
                  <div className="relative w-28 h-28 mx-auto">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-[5px] border-[var(--color-accent)]/10" />
                    {/* Progress arc */}
                    <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-[var(--color-accent)] animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                    {/* Center */}
                    <div className="absolute inset-[6px] rounded-full bg-[var(--color-background)] flex items-center justify-center">
                      <Hexagon className="w-6 h-6 text-[var(--color-accent)]/60 rotate-90" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="font-mono text-sm text-[var(--color-foreground)] font-medium">
                    {t("dashboard.allocation100")}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/3 border border-[var(--color-accent)]/8 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6 text-[var(--color-accent)]/20" />
                  </div>
                  <p className="text-[11px] font-mono text-[var(--color-muted)]/40 tracking-wider uppercase">
                    {t("dashboard.allocationPlaceholder")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Position / Activity ── */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--color-background)]/60 border border-[var(--color-border)]/30 hover:border-[var(--color-border)]/60 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/6 border border-[var(--color-accent)]/10 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {t("dashboard.vaultPosition")}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-wide">
                      {shares.toLocaleString()} {t("dashboard.shares")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-[var(--color-foreground)]">
                    ${userPosition.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-success)]" />
                    <p className="text-[10px] font-mono text-[var(--color-success)] tracking-wider uppercase">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-elevated)] flex items-center justify-center mx-auto mb-3">
                <Activity className="w-5 h-5 text-[var(--color-muted)]/30" />
              </div>
              <p className="text-[11px] font-mono text-[var(--color-muted)]/50 tracking-wider">
                {t("dashboard.noWallet")} — {t("dashboard.connectToBegin")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Stat Card ── */
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
  accent: "gold" | "navy" | "blue" | "emerald";
  muted?: boolean;
}) {
  const colors: Record<"gold" | "navy" | "blue" | "emerald", { dot: string; text: string; bg: string; border: string }> = {
    gold: {
      dot: "bg-[var(--color-accent)]",
      text: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]/6",
      border: "border-[var(--color-accent)]/15",
    },
    navy: {
      dot: "bg-[var(--color-primary)]",
      text: "text-[var(--color-primary)]",
      bg: "bg-[var(--color-primary)]/6",
      border: "border-[var(--color-primary)]/15",
    },
    blue: {
      dot: "bg-[var(--color-accent-blue)]",
      text: "text-[var(--color-accent-blue)]",
      bg: "bg-[var(--color-accent-blue)]/6",
      border: "border-[var(--color-accent-blue)]/15",
    },
    emerald: {
      dot: "bg-[var(--color-success)]",
      text: "text-[var(--color-success)]",
      bg: "bg-[var(--color-success)]/6",
      border: "border-[var(--color-success)]/15",
    },
  };

  const c = colors[accent];

  return (
    <Card className="overflow-hidden card-glow">
      {/* Colored accent line at top */}
      <div className={cn("h-px", muted ? "bg-transparent" : c.dot)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border",
              muted
                ? "text-[var(--color-muted)]/40 bg-transparent border-[var(--color-border)]/30"
                : `${c.text} ${c.bg} ${c.border}`
            )}
          >
            {label}
          </span>
          <Icon className={cn("w-4 h-4", muted ? "text-[var(--color-muted)]/25" : c.text)} />
        </div>
        <p
          className={cn(
            "font-mono text-2xl font-semibold tracking-tight",
            muted ? "text-[var(--color-muted)]/40" : "text-[var(--color-foreground)]"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
