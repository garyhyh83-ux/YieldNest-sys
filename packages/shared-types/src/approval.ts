export type ApprovalType =
  | "withdrawal"
  | "whitelist_change"
  | "role_change"
  | "strategy_change"
  | "account_recovery";

export type ApprovalStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type VoteType = "approve" | "reject";

export type ApprovalConditionOperator = "eq" | "gt" | "gte" | "lt" | "lte";

export interface ApprovalCondition {
  field: string;
  operator: ApprovalConditionOperator;
  value: string | number;
}

export interface PolicyRule {
  condition: string;
  approvalType: "auto" | "single" | "multi";
  quorum: number;
  eligibleApprovers: string[];
  requiredApprovers?: string[];
}

export interface ApprovalPolicy {
  id: string;
  enterpriseId: string;
  policyType: ApprovalType;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  enterpriseId: string;
  approvalType: ApprovalType;
  requestedBy: string;
  status: ApprovalStatus;
  requiredQuorum: number;
  currentQuorum: number;
  payload: Record<string, unknown>;
  idempotencyKey: string | null;
  expiresAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ApprovalVote {
  id: string;
  approvalId: string;
  voterId: string;
  vote: VoteType;
  comment: string | null;
  createdAt: string;
}

export interface ApprovalVoteRequest {
  vote: VoteType;
  comment?: string;
}

export interface ApprovalPolicyCreateRequest {
  policyType: ApprovalType;
  rules: PolicyRule[];
}

export interface ApprovalRequest {
  approvalType: ApprovalType;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  amount: string;
}

export interface ApprovalListItem extends Approval {
  voteCount: number;
  userVote?: VoteType;
}

export interface ApprovalDetail {
  approval: Approval;
  votes: ApprovalVote[];
}

export interface PaginatedApprovalResponse {
  success: true;
  data: Approval[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
