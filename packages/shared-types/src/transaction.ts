export type TxType = "deposit" | "withdraw" | "yield" | "fee" | "gas";
export type TxDirection = "in" | "out";
export type TxStatus =
  | "pending"
  | "awaiting_approval"
  | "approved"
  | "processing"
  | "confirmed"
  | "failed"
  | "cancelled";

export interface Transaction {
  id: string;
  enterpriseId: string;
  smartAccountId: string | null;
  txType: TxType;
  asset: string;
  amount: string;
  direction: TxDirection;
  status: TxStatus;
  chainTxHash: string | null;
  userOpHash: string | null;
  approvalId: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  confirmedAt: string | null;
}

export interface DepositRequest {
  asset: string;
  chainId: number;
}

export interface DepositResponse {
  id: string;
  accountAddress: string;
  asset: string;
  chainId: number;
  expectedConfirmations: number;
}

export interface WithdrawalRequest {
  smartAccountId: string;
  asset: string;
  amount: string;
  destinationAddress: string;
  idempotencyKey: string;
}

export interface WithdrawalResponse {
  id: string;
  status: TxStatus;
  approvalRequired: boolean;
  approvalId?: string;
  estimatedCompletionTime?: string;
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  type?: TxType;
  status?: TxStatus;
  asset?: string;
  fromDate?: string;
  toDate?: string;
}
