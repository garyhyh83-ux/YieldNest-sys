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
    <header className="h-16 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 ml-64">
      {/* Left — navy accent */}
      <div className="flex items-center gap-3">
        <div className="navy-rule" />
        <h2 className="text-[13px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
          {t("dashboard.subtitle")}
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <ChainSwitcher />

        {/* Wallet status */}
        {!mounted ? (
          <div className="w-24 h-6 rounded-md bg-[var(--color-muted)]/10 animate-data-pulse" />
        ) : connected && address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-elevated)] border border-[var(--color-border)] shadow-sm">
            <div className="live-dot !m-0 !w-1.5 !h-1.5" />
            <span className="text-[13px] font-mono text-[var(--color-muted)] tracking-wide">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] font-mono">
            <Wallet className="w-3 h-3" />
            No Wallet
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-[13px] tracking-wider">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
