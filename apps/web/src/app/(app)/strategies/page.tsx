"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useLocale } from "@/providers/locale-provider";
import { useMounted } from "@/hooks/use-mounted";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ADDRESSES,
  VaultABI,
  useStrategyCount,
  useStrategyInfo,
} from "@/lib/web3/contracts";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/lib/web3/config";
import { toast } from "sonner";
import { Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

function StrategyCard({ id }: { id: number }) {
  const { t } = useLocale();
  const { data: strategy } = useStrategyInfo(BigInt(id));
  const [claiming, setClaiming] = useState(false);

  if (!strategy) return null;

  const [adapter, targetWeight, currentWeight, active] = strategy as [never, bigint, bigint, boolean];
  const isActive = active as boolean;
  const targetPct = Number(targetWeight as bigint) / 100;
  const currentPct = Number(currentWeight as bigint) / 100;

  const handleClaimYield = async () => {
    setClaiming(true);
    try {
      toast.info(t("strategies.claiming"));
      const hash = await writeContract(wagmiConfig, {
        abi: VaultABI,
        address: ADDRESSES.vault,
        functionName: "claimYield",
        args: [],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toast.success(t("strategies.claimSuccess"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("strategies.claimFailed");
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Card className="card-glow corner-accent overflow-hidden">
      {/* Status accent stripe at top */}
      <div
        className={cn(
          "h-0.5",
          isActive ? "bg-emerald-500" : "bg-[var(--color-muted)]"
        )}
      />

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-[var(--color-foreground)] text-xs font-semibold">
            {t("strategies.strategyN", { n: id + 1 })}
          </span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.12em] border",
              isActive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-[var(--color-muted)]/6 text-[var(--color-muted)] border-[var(--color-border)]/50"
            )}
          >
            {isActive ? t("strategies.active") : t("strategies.inactive")}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Strategy detail rows */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
              {t("strategies.adapter")}
            </span>
            <span className="font-mono text-xs text-[var(--color-foreground)] tracking-wide">
              {(adapter as string).slice(0, 10)}...
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
              {t("strategies.targetWeight")}
            </span>
            <span className="font-mono text-xs text-[var(--color-foreground)]">
              {targetPct}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
              {t("strategies.currentWeight")}
            </span>
            <span className="font-mono text-xs text-[var(--color-foreground)]">
              {currentPct}%
            </span>
          </div>
        </div>

        {/* Progress bar — gold fill */}
        <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden border border-[var(--color-border)]/40">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(currentPct, 100)}%` }}
          />
        </div>

        {/* Claim yield button — gold CTA */}
        <Button
          variant="gold"
          size="sm"
          className="w-full"
          onClick={handleClaimYield}
          disabled={claiming}
        >
          {claiming && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
          {claiming ? t("strategies.claiming") : t("strategies.claimYield")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StrategiesPage() {
  const mounted = useMounted();
  const { t } = useLocale();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: strategyCount } = useStrategyCount();
  const count = strategyCount ? Number(strategyCount as bigint) : 0;

  /* ── Disconnected / loading state ── */
  if (!mounted || !isConnected) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-foreground)]">
            {t("strategies.title")}
          </h1>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="accent-rule" />
            <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
              {t("strategies.subtitle")}
            </p>
          </div>
        </div>

        {/* Connect prompt card */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-10 corner-accent card-glow">
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/6 border border-[var(--color-accent)]/12 flex items-center justify-center mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-accent)_12%,transparent),transparent_70%)]" />
              <Layers className="w-6 h-6 text-[var(--color-accent)]/60 relative" />
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              {t("strategies.connectWallet")}
            </p>
            {connectors.length > 0 && connectors[0] && (
              <Button variant="default" onClick={() => connect({ connector: connectors[0]! })}>
                {t("strategies.connectWallet")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Connected state ── */
  return (
    <div className="space-y-8 stagger-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-foreground)]">
            {t("strategies.title")}
          </h1>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="accent-rule" />
            <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
              {t("strategies.subtitle")}
            </p>
          </div>
        </div>

        {/* Connection badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/15 backdrop-blur-sm">
          <span className="live-dot !m-0" />
          <span className="text-[11px] font-mono text-emerald-600 font-medium tracking-[0.15em] uppercase">
            Connected
          </span>
        </div>
      </div>

      {/* ── Strategy Cards Grid ── */}
      {count === 0 ? (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-10 text-center corner-accent card-glow">
          <div className="w-14 h-14 rounded-xl bg-[var(--color-foreground)]/3 border border-[var(--color-border)]/30 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-[var(--color-muted)]/30" />
          </div>
          <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.15em] uppercase">
            {t("strategies.noStrategies")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: count }, (_, i) => (
            <StrategyCard key={i} id={i} />
          ))}
        </div>
      )}

      {/* ── Yield Summary ── */}
      <Card className="card-glow corner-accent">
        <CardHeader>
          <CardTitle className="text-[var(--color-foreground)] text-xs font-semibold">
            {t("strategies.yieldSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-5 text-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
                {t("strategies.platformFee")}
              </p>
              <p className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                {t("strategies.platformFeeValue")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
                {t("strategies.compoundFrequency")}
              </p>
              <p className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                {t("strategies.compoundValue")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
                {t("strategies.strategiesActive")}
              </p>
              <p className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                {count}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-[0.12em] uppercase">
                {t("strategies.withdrawalTime")}
              </p>
              <p className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                {t("strategies.withdrawalTimeValue")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
