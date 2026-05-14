import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { anvilBaseSepolia } from "./config";

// ── Deployed Addresses (from contracts/deployments/localhost.json) ──
const ADDRESSES = {
  usdc: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  vault: "0x9A676e781A523b5d0C0e43731313A708CB607508",
} as const;

// ── YieldNestVault ABI (partial — deposit / withdraw / claimYield / views) ──
const VaultABI = [
  // Write
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "strategyId", type: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "strategyId", type: "uint256" },
    ],
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimYield",
    inputs: [],
    outputs: [{ name: "netYield", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  // Read
  {
    type: "function",
    name: "userShares",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalShares",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalValue",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "strategies",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "adapter", type: "address" },
      { name: "targetWeight", type: "uint256" },
      { name: "currentWeight", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "strategyCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "minDeposit",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ── ERC20 ABI (partial) ──
const ERC20ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

// ── Hook: USDC Balance ──
export function useUsdcBalance(address?: `0x${string}`) {
  return useReadContract({
    abi: ERC20ABI,
    address: ADDRESSES.usdc,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

// ── Hook: USDC Approval ──
export function useUsdcApprove(spender: `0x${string}`, amount: bigint) {
  return useWriteContract({
    mutation: {
      onError: (err) => console.error("USDC approve failed:", err),
    },
  });
}

// ── Hook: Vault User Shares ──
export function useVaultUserShares(address?: `0x${string}`) {
  return useReadContract({
    abi: VaultABI,
    address: ADDRESSES.vault,
    functionName: "userShares",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

// ── Hook: Vault Total Value ──
export function useVaultTotalValue() {
  return useReadContract({
    abi: VaultABI,
    address: ADDRESSES.vault,
    functionName: "totalValue",
    args: [],
    query: { refetchInterval: 15_000 },
  });
}

// ── Hook: Vault Total Shares ──
export function useVaultTotalShares() {
  return useReadContract({
    abi: VaultABI,
    address: ADDRESSES.vault,
    functionName: "totalShares",
    args: [],
    query: { refetchInterval: 15_000 },
  });
}

// ── Hook: Strategy Info ──
export function useStrategyInfo(strategyId: bigint) {
  return useReadContract({
    abi: VaultABI,
    address: ADDRESSES.vault,
    functionName: "strategies",
    args: [strategyId],
    query: { refetchInterval: 30_000 },
  });
}

// ── Hook: Strategy Count ──
export function useStrategyCount() {
  return useReadContract({
    abi: VaultABI,
    address: ADDRESSES.vault,
    functionName: "strategyCount",
    args: [],
  });
}

// ── Hook: Min Deposit ──
export function useMinDeposit() {
  return useReadContract({
    abi: VaultABI,
    address: ADDRESSES.vault,
    functionName: "minDeposit",
    args: [],
  });
}

// ── Hook: Deposit ──
export function useVaultDeposit() {
  return useWriteContract({});
}

// ── Hook: Withdraw ──
export function useVaultWithdraw() {
  return useWriteContract({});
}

// ── Hook: Claim Yield ──
export function useVaultClaimYield() {
  return useWriteContract({});
}

// ── Helpers ──
export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, 6);
}

export function parseUsdc(amount: string): bigint {
  return parseUnits(amount, 6);
}

export { ADDRESSES, VaultABI, ERC20ABI };
