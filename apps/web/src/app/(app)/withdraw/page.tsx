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
  useVaultUserShares,
  useVaultTotalValue,
  useVaultTotalShares,
} from "@/lib/web3/contracts";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/lib/web3/config";
import { toast } from "sonner";
import { Loader2, Wallet, ArrowUpFromLine, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WithdrawPage() {
  const mounted = useMounted();
  const { t } = useLocale();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: userShares } = useVaultUserShares(address);
  const { data: totalValue } = useVaultTotalValue();
  const { data: totalShares } = useVaultTotalShares();

  const sharesNum = userShares ? Number(userShares as bigint) : 0;
  const tvNum = totalValue ? Number(totalValue as bigint) : 0;
  const tsNum = totalShares ? Number(totalShares as bigint) : 0;
  const userPosition = tsNum > 0 ? (sharesNum * tvNum) / tsNum : 0;
  const maxWithdraw = userPosition / 1e6;

  const handleWithdraw = async () => {
    if (!amount || !recipient || !address) return;
    setLoading(true);
    try {
      const usdcAmount = Number(amount) * 1e6;
      const sharesToRedeem =
        tsNum > 0 && tvNum > 0
          ? BigInt(Math.floor((usdcAmount * tsNum) / tvNum))
          : BigInt(Math.floor(usdcAmount));

      toast.info(t("withdraw.withdrawing"));
      const hash = await writeContract(wagmiConfig, {
        abi: VaultABI,
        address: ADDRESSES.vault,
        functionName: "withdraw",
        args: [sharesToRedeem, recipient as `0x${string}`, 0n],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toast.success(
        t("withdraw.success", { amount, address: recipient.slice(0, 10) }),
      );
      setAmount("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("withdraw.failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--color-foreground)]">
            {t("withdraw.title")}
          </h1>
          <div className="accent-rule my-3" />
          <p className="font-mono text-sm text-[var(--color-muted)]">
            {t("withdraw.subtitle")}
          </p>
        </div>

        <Card className="rounded-xl bg-[var(--color-card)] card-glow">
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent)]/4 border border-[var(--color-accent)]/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-[var(--color-accent)]" />
            </div>
            <p className="text-[var(--color-muted)] text-lg">
              {t("withdraw.connectWallet")}
            </p>
            {connectors.length > 0 && connectors[0] && (
              <Button
                variant="default"
                size="lg"
                onClick={() => connect({ connector: connectors[0]! })}
              >
                {t("withdraw.connect")}
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
        <h1 className="text-[28px] font-bold text-[var(--color-foreground)]">
          {t("withdraw.title")}
        </h1>
        <div className="accent-rule my-3" />
        <p className="font-mono text-sm text-[var(--color-muted)]">
          {t("withdraw.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main withdraw form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-glow shimmer-hover corner-accent">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-[var(--color-accent)]" />
                {t("withdraw.withdrawBtn")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  {t("withdraw.amountLabel")}
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder={t("withdraw.amountPlaceholder")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="font-mono"
                  />
                  <Button
                    variant="vault"
                    size="sm"
                    onClick={() => setAmount(String(maxWithdraw))}
                    disabled={loading}
                  >
                    {t("withdraw.max")}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  {t("withdraw.destAddress")}
                </label>
                <Input
                  type="text"
                  placeholder={t("withdraw.destPlaceholder")}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={loading}
                  className="font-mono mt-2"
                />
              </div>

              <Button
                className="w-full"
                variant="gold"
                size="lg"
                onClick={handleWithdraw}
                disabled={
                  loading || !amount || !recipient || Number(amount) <= 0
                }
              >
                {loading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-[var(--color-accent)]" />
                )}
                {loading
                  ? t("withdraw.withdrawing")
                  : t("withdraw.withdrawBtn")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="card-glow shimmer-hover">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-[var(--color-accent)]" />
                {t("withdraw.yourPosition")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("withdraw.vaultShares")}
                  </span>
                  <span className="font-mono">
                    {sharesNum.toLocaleString()}
                  </span>
                </div>
                <div className="accent-rule my-2 opacity-50" />
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("withdraw.usdcValue")}
                  </span>
                  <span className="font-mono">
                    $
                    {(userPosition / 1e6).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="accent-rule my-2 opacity-50" />
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">
                    {t("withdraw.available")}
                  </span>
                  <span className="font-mono">
                    {maxWithdraw.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    USDC
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
