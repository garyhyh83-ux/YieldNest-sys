"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
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
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);

  const current = CHAINS.find((c) => c.id === chainId) ?? CHAINS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) return <div className="w-36 h-7 rounded-md bg-[var(--color-foreground)]/3 animate-data-pulse" />;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-muted-light)] hover:border-[var(--color-accent)]/25 hover:text-[var(--color-foreground)] transition-all duration-200"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-[var(--color-background)]"
          style={{ backgroundColor: current.color, boxShadow: `0 0 6px ${current.color}40` }}
        />
        <span className="tracking-wide">{current.name}</span>
        <ChevronDown className={cn("w-3 h-3 text-[var(--color-muted)] transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 py-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl shadow-black/30 backdrop-blur-xl z-50 overflow-hidden">
          {CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => {
                switchChain({ chainId: chain.id });
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-mono transition-colors",
                chain.id === chainId
                  ? "bg-[var(--color-accent)]/8 text-[var(--color-accent)] border-l-[3px] border-l-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-foreground)]/3 border-l-[3px] border-l-transparent"
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: chain.color, boxShadow: chain.id === chainId ? `0 0 8px ${chain.color}60` : "none" }}
              />
              {chain.name}
              {chain.id === chainId && (
                <span className="ml-auto text-[10px] text-[var(--color-accent)]/70 font-medium tracking-wider">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
