export type AuditAction =
  | "user.registered"
  | "user.login"
  | "user.logout"
  | "user.recovered"
  | "enterprise.created"
  | "enterprise.kyb_updated"
  | "member.invited"
  | "member.role_changed"
  | "member.removed"
  | "account.deployed"
  | "account.owner_added"
  | "account.owner_removed"
  | "whitelist.added"
  | "whitelist.removed"
  | "whitelist.approved"
  | "transaction.deposit"
  | "transaction.withdrawal"
  | "transaction.cancelled"
  | "approval.requested"
  | "approval.voted"
  | "approval.resolved"
  | "strategy.updated"
  | "rebalance.executed"
  | "yield.claimed"
  | "limits.updated"
  | "risk.pause"
  | "risk.resume";

export interface AuditLog {
  id: string;
  enterpriseId: string | null;
  actorId: string | null;
  action: AuditAction;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
