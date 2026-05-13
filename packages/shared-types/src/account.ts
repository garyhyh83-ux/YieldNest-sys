export type ChainId = 8453 | 42161 | 1; // Base | Arbitrum | Ethereum

export const CHAIN_NAMES: Record<ChainId, string> = {
  8453: "Base",
  42161: "Arbitrum",
  1: "Ethereum",
};

export interface Owner {
  address: string;
  type: "passkey" | "email_recovery" | "hardware_key" | "platform_recovery";
  addedAt: string;
}

export interface SmartAccount {
  id: string;
  enterpriseId: string;
  chainId: ChainId;
  accountAddress: string;
  safeVersion: string | null;
  owners: Owner[];
  threshold: number;
  factorySalt: string | null;
  deployedAt: string | null;
  createdAt: string;
}

export interface SmartAccountCreateRequest {
  chainId: ChainId;
  owners: { address: string; type: Owner["type"] }[];
  threshold: number;
}

export interface BalanceResponse {
  accountId: string;
  asset: string;
  balance: string;
  chainId: ChainId;
}
