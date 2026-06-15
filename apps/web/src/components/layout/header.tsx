"use client";

import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ChainSwitcher } from "@/components/web3/ChainSwitcher";
import { useMounted } from "@/hooks/use-mounted";
import { LogOut, Wallet } from "lucide-react";

export function Header() {
  const mounted = useMounted();
  const { logout } = useAuth();
  const { t } = useLocale();
  const { address, isConnected } = useAccount();

  const connected = mounted && isConnected;

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-xl flex items-center justify-between px-6 ml-64">
      <div>
        <h2 className="text-xs font-mono text-[var(--color-muted)] tracking-widest uppercase">
          {t("dashboard.subtitle")}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <ChainSwitcher />

        {/* Wallet status — only render after mount to avoid SSR mismatch */}
        {!mounted ? (
          <div className="w-24 h-6" />
        ) : connected && address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            <span className="text-[11px] font-mono text-[var(--color-muted-light)]">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] font-mono">
            <Wallet className="w-3 h-3" />
            No Wallet
          </div>
        )}

        <div className="w-px h-5 bg-[var(--color-border)]" />

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-1.5" />
          <span className="text-xs">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
