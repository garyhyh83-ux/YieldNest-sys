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
import { Loader2 } from "lucide-react";

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
      const sharesToRedeem = tsNum > 0 && tvNum > 0
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
      toast.success(t("withdraw.success", { amount, address: recipient.slice(0, 10) }));
      setAmount("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("withdraw.failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("withdraw.title")}</h1>
          <p className="text-[var(--color-muted)] mt-1">{t("withdraw.subtitle")}</p>
        </div>
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <p className="text-[var(--color-muted)]">{t("withdraw.connectWallet")}</p>
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
        <h1 className="text-2xl font-bold">{t("withdraw.title")}</h1>
        <p className="text-[var(--color-muted)] mt-1">{t("withdraw.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("withdraw.withdrawBtn")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[var(--color-muted)]">{t("withdraw.amountLabel")}</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder={t("withdraw.amountPlaceholder")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                  />
                  <Button variant="outline" onClick={() => setAmount(String(maxWithdraw))} disabled={loading}>
                    {t("withdraw.max")}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-[var(--color-muted)]">{t("withdraw.destAddress")}</label>
                <Input
                  type="text"
                  placeholder={t("withdraw.destPlaceholder")}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleWithdraw}
                disabled={loading || !amount || !recipient || Number(amount) <= 0}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? t("deposit.processing") : t("withdraw.withdrawBtn")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("withdraw.yourPosition")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("withdraw.vaultShares")}</span>
                  <span>{sharesNum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("withdraw.usdcValue")}</span>
                  <span>${(userPosition / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted)]">{t("withdraw.available")}</span>
                  <span>{maxWithdraw.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
