import { useReadContract, useWriteContract, useAccount, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";

// ── Per-chain deployed addresses ──
const CHAIN_ADDRESSES: Record<number, { usdc: `0x${string}`; vault: `0x${string}` }> = {
  // Base Sepolia (Anvil local)
  84532: {
    usdc: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    vault: "0x9A676e781A523b5d0C0e43731313A708CB607508",
  },
  // Arbitrum Sepolia
  421614: {
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    vault: "0x0000000000000000000000000000000000000000", // TBD after deploy
  },
  // Ethereum Sepolia
  11155111: {
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    vault: "0x0000000000000000000000000000000000000000", // TBD after deploy
  },
};

function useContractAddresses() {
  const chainId = useChainId();
  return CHAIN_ADDRESSES[chainId] ?? CHAIN_ADDRESSES[84532]!;
}

// ── YieldNestVault ABI (partial — deposit / withdraw / claimYield / views) ──
const VaultABI = [
  {
    type: "function", name: "deposit",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "strategyId", type: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "withdraw",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "strategyId", type: "uint256" },
    ],
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "claimYield",
    inputs: [],
    outputs: [{ name: "netYield", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "userShares",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "totalShares",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "totalValue",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "strategies",
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
    type: "function", name: "strategyCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "minDeposit",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const ERC20ABI = [
  {
    type: "function", name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

// ── Hook: USDC Balance ──
export function useUsdcBalance(address?: `0x${string}`) {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: ERC20ABI, address: addrs.usdc, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

// ── Hook: USDC Approval ──
export function useUsdcApprove(spender: `0x${string}`, amount: bigint) {
  return useWriteContract({
    mutation: { onError: (err) => console.error("USDC approve failed:", err) },
  });
}

// ── Hook: Vault User Shares ──
export function useVaultUserShares(address?: `0x${string}`) {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: VaultABI, address: addrs.vault, functionName: "userShares",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

// ── Hook: Vault Total Value ──
export function useVaultTotalValue() {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: VaultABI, address: addrs.vault, functionName: "totalValue",
    args: [], query: { refetchInterval: 15_000 },
  });
}

// ── Hook: Vault Total Shares ──
export function useVaultTotalShares() {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: VaultABI, address: addrs.vault, functionName: "totalShares",
    args: [], query: { refetchInterval: 15_000 },
  });
}

// ── Hook: Strategy Info ──
export function useStrategyInfo(strategyId: bigint) {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: VaultABI, address: addrs.vault, functionName: "strategies",
    args: [strategyId], query: { refetchInterval: 30_000 },
  });
}

// ── Hook: Strategy Count ──
export function useStrategyCount() {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: VaultABI, address: addrs.vault, functionName: "strategyCount", args: [],
  });
}

// ── Hook: Min Deposit ──
export function useMinDeposit() {
  const addrs = useContractAddresses();
  return useReadContract({
    abi: VaultABI, address: addrs.vault, functionName: "minDeposit", args: [],
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

// Backwards-compatible export for direct useReadContract calls
const ADDRESSES = CHAIN_ADDRESSES[84532]!;
export { VaultABI, ERC20ABI, CHAIN_ADDRESSES, ADDRESSES };
