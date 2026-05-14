"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useLocale } from "@/providers/locale-provider";
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
import { Loader2 } from "lucide-react";

export default function DepositPage() {
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

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("deposit.title")}</h1>
          <p className="text-[var(--color-muted)] mt-1">{t("deposit.subtitle")}</p>
        </div>
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <p className="text-[var(--color-muted)]">{t("deposit.connectWallet")}</p>
            {connectors.length > 0 && connectors[0] && (
              <Button onClick={() => connect({ connector: connectors[0]! })}>{t("deposit.connect")}</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("deposit.title")}</h1>
        <p className="text-[var(--color-muted)] mt-1">{t("deposit.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("deposit.depositBtn")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  {t("deposit.amountLabel", { min: minDepositFormatted })}
                </label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder={t("deposit.amountPlaceholder")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                  />
                  <Button variant="outline" onClick={() => setAmount(balanceFormatted)} disabled={loading}>
                    {t("deposit.max")}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">{t("deposit.walletBalance")}</span>
                <span>{Number(balanceFormatted).toLocaleString()} USDC</span>
              </div>
              <Button
                className="w-full"
                onClick={handleDeposit}
                disabled={loading || !amount || Number(amount) < Number(minDepositFormatted)}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? t("deposit.processing") : t("deposit.depositBtn")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("deposit.strategy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("deposit.strategySelected")}</span>
                  <span>{t("deposit.strategyMock")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("deposit.expectedApy")}</span>
                  <span className="text-green-400">4.50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">Risk</span>
                  <span>{t("deposit.riskLow")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("deposit.vaultStats")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("deposit.tvl")}</span>
                  <span>{totalValue ? formatUsdc(totalValue as bigint) : "0"} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("deposit.strategiesCount")}</span>
                  <span>{strategyCount ? String(strategyCount) : "0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
