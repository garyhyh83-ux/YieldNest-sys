"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAINS = [
  { id: 84532, name: "Base Sepolia", color: "#0052FF" },
  { id: 421614, name: "Arbitrum Sepolia", color: "#28A0F0" },
  { id: 11155111, name: "Ethereum Sepolia", color: "#627EEA" },
] as const;

export function ChainSwitcher() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const current = CHAINS.find((c) => c.id === chainId) ?? CHAINS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/30 transition-colors"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: current.color }}
        />
        <span>{current.name}</span>
        <ChevronDown className="w-3 h-3 text-[var(--color-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl z-50">
          {CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => {
                switchChain({ chainId: chain.id });
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-[12px] font-mono transition-colors hover:bg-white/[0.04]",
                chain.id === chainId
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted)]"
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: chain.color }}
              />
              {chain.name}
              {chain.id === chainId && (
                <span className="ml-auto text-[10px] text-[var(--color-accent)]">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
