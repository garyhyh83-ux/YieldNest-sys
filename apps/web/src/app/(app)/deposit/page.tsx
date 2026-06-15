"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useLocale } from "@/providers/locale-provider";
import { useMounted } from "@/hooks/use-mounted";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADDRESSES,
  VaultABI,
  ERC20ABI,
  useUsdcBalance,
  useVaultTotalValue,
  useStrategyCount,
  useMinDeposit,
  formatUsdc,
  parseUsdc,
} from "@/lib/web3/contracts";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/lib/web3/config";
import { toast } from "sonner";
import { Loader2, Wallet, ArrowDownToLine, TrendingUp, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DepositPage() {
  const mounted = useMounted();
  const { t } = useLocale();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: usdcBalance } = useUsdcBalance(address);
  const { data: totalValue } = useVaultTotalValue();
  const { data: strategyCount } = useStrategyCount();
  const { data: minDeposit } = useMinDeposit();

  const minDepositFormatted = minDeposit ? formatUsdc(minDeposit as bigint) : "10";
  const balanceFormatted = usdcBalance ? formatUsdc(usdcBalance as bigint) : "0";

  const handleDeposit = async () => {
    if (!amount || !address) return;
    setLoading(true);
    try {
      const parsed = parseUsdc(amount);

      const allowanceBefore = await readContract(wagmiConfig, {
        abi: ERC20ABI,
        address: ADDRESSES.usdc,
        functionName: "allowance",
        args: [address, ADDRESSES.vault],
      });

      if ((allowanceBefore as bigint) < parsed) {
        toast.info(t("deposit.approving"));
        const approveHash = await writeContract(wagmiConfig, {
          abi: ERC20ABI,
          address: ADDRESSES.usdc,
          functionName: "approve",
          args: [ADDRESSES.vault, parsed],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        toast.success(t("deposit.approved"));
      }

      toast.info(t("deposit.depositing"));
      const depositHash = await writeContract(wagmiConfig, {
        abi: VaultABI,
        address: ADDRESSES.vault,
        functionName: "deposit",
        args: [parsed, 0n],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: depositHash });
      toast.success(t("deposit.success", { amount }));
      setAmount("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("deposit.failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[var(--color-text)]">
            {t("deposit.title")}
          </h1>
          <div className="accent-rule my-3" />
          <p className="font-mono text-sm text-[var(--color-muted)]">
            {t("deposit.subtitle")}
          </p>
        </div>

        <Card className="rounded-xl bg-[var(--color-card)] card-glow">
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent)]/4 border border-[var(--color-accent)]/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-[var(--color-accent)]" />
            </div>
            <p className="text-[var(--color-muted)] text-lg">
              {t("deposit.connectWallet")}
            </p>
            {connectors.length > 0 && connectors[0] && (
              <Button
                variant="default"
                size="lg"
                onClick={() => connect({ connector: connectors[0]! })}
              >
                {t("deposit.connect")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[28px] font-bold text-[var(--color-text)]">
          {t("deposit.title")}
        </h1>
        <div className="accent-rule my-3" />
        <p className="font-mono text-sm text-[var(--color-muted)]">
          {t("deposit.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main deposit form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-glow shimmer-hover corner-accent">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-[var(--color-accent)]" />
                {t("deposit.depositBtn")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  {t("deposit.amountLabel", { min: minDepositFormatted })}
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder={t("deposit.amountPlaceholder")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="font-mono"
                  />
                  <Button
                    variant="vault"
                    size="sm"
                    onClick={() => setAmount(balanceFormatted)}
                    disabled={loading}
                  >
                    {t("deposit.max")}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-[var(--color-accent)]/4 border border-[var(--color-accent)]/10">
                <span className="text-[var(--color-muted)]">
                  {t("deposit.walletBalance")}
                </span>
                <span className="font-mono">
                  {Number(balanceFormatted).toLocaleString()} USDC
                </span>
              </div>

              <Button
                className="w-full"
                variant="default"
                size="lg"
                onClick={handleDeposit}
                disabled={
                  loading ||
                  !amount ||
                  Number(amount) < Number(minDepositFormatted)
                }
              >
                {loading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-[var(--color-accent)]" />
                )}
                {loading ? t("deposit.processing") : t("deposit.depositBtn")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="card-glow shimmer-hover">
            <CardHeader>
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                {t("deposit.strategy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("deposit.strategySelected")}
                  </span>
                  <span className="font-mono">{t("deposit.strategyMock")}</span>
                </div>
                <div className="accent-rule my-2 opacity-50" />
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("deposit.expectedApy")}
                  </span>
                  <span className="font-mono text-emerald-500">4.50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">Risk</span>
                  <span className="font-mono">{t("deposit.riskLow")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow shimmer-hover">
            <CardHeader>
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                {t("deposit.vaultStats")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("deposit.tvl")}
                  </span>
                  <span className="font-mono">
                    {totalValue ? formatUsdc(totalValue as bigint) : "0"} USDC
                  </span>
                </div>
                <div className="accent-rule my-2 opacity-50" />
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("deposit.strategiesCount")}
                  </span>
                  <span className="font-mono">
                    {strategyCount ? String(strategyCount) : "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
