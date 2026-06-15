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
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)]/60 backdrop-blur-xl flex items-center justify-between px-6 ml-64">
      {/* Left — architectural accent */}
      <div className="flex items-center gap-3">
        <div className="accent-rule" />
        <h2 className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
          {t("dashboard.subtitle")}
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <ChainSwitcher />

        {/* Wallet status */}
        {!mounted ? (
          <div className="w-24 h-6 rounded-md bg-[var(--color-foreground)]/3 animate-data-pulse" />
        ) : connected && address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-sm">
            <div className="live-dot !m-0 !w-1.5 !h-1.5" />
            <span className="text-[11px] font-mono text-[var(--color-muted-light)] tracking-wide">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] font-mono">
            <Wallet className="w-3 h-3" />
            No Wallet
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--color-border)]/60" />

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-[11px] tracking-wider">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
