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
import { Loader2 } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{t("strategies.strategyN", { n: id + 1 })}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
            {isActive ? t("strategies.active") : t("strategies.inactive")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">{t("strategies.adapter")}</span>
            <span className="font-mono text-xs">{(adapter as string).slice(0, 10)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">{t("strategies.targetWeight")}</span>
            <span>{targetPct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">{t("strategies.currentWeight")}</span>
            <span>{currentPct}%</span>
          </div>
        </div>

        <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-accent)] rounded-full transition-all" style={{ width: `${Math.min(currentPct, 100)}%` }} />
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={handleClaimYield} disabled={claiming}>
          {claiming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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

  if (!mounted || !isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("strategies.title")}</h1>
          <p className="text-[var(--color-muted)] mt-1">{t("strategies.subtitle")}</p>
        </div>
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <p className="text-[var(--color-muted)]">{t("strategies.connectWallet")}</p>
            {connectors.length > 0 && connectors[0] && (
              <Button onClick={() => connect({ connector: connectors[0]! })}>{t("withdraw.connect")}</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("strategies.title")}</h1>
        <p className="text-[var(--color-muted)] mt-1">{t("strategies.subtitle")}</p>
      </div>

      {count === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-[var(--color-muted)]">{t("strategies.noStrategies")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: count }, (_, i) => (
            <StrategyCard key={i} id={i} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("strategies.yieldSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-muted)]">{t("strategies.platformFee")}</p>
              <p className="font-semibold">{t("strategies.platformFeeValue")}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted)]">{t("strategies.compoundFrequency")}</p>
              <p className="font-semibold">{t("strategies.compoundValue")}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted)]">{t("strategies.strategiesActive")}</p>
              <p className="font-semibold">{count}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted)]">{t("strategies.withdrawalTime")}</p>
              <p className="font-semibold">{t("strategies.withdrawalTimeValue")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
