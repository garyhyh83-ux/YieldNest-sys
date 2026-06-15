"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n/translations";

// ── Demo / mock data ──
const MOCK_APPROVALS = [
  {
    id: "appr-001",
    enterpriseId: "demo-enterprise-001",
    approvalType: "withdrawal" as const,
    requestedBy: "demo-user-002",
    status: "pending" as const,
    requiredQuorum: 2,
    currentQuorum: 0,
    payload: { amount: "75000", destinationAddress: "0x1234...5678", eligibleApprovers: ["role:cfo", "role:ceo"], requiredApprovers: ["role:cfo"] },
    idempotencyKey: null,
    expiresAt: new Date(Date.now() + 20 * 3600000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "appr-002",
    enterpriseId: "demo-enterprise-001",
    approvalType: "whitelist_change" as const,
    requestedBy: "demo-user-003",
    status: "in_progress" as const,
    requiredQuorum: 2,
    currentQuorum: 1,
    payload: { operation: "add", address: "0xabcd...ef01", label: "Corporate Treasury", eligibleApprovers: ["role:cfo", "role:ceo"] },
    idempotencyKey: null,
    expiresAt: new Date(Date.now() + 18 * 3600000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "appr-003",
    enterpriseId: "demo-enterprise-001",
    approvalType: "strategy_change" as const,
    requestedBy: "demo-user-002",
    status: "approved" as const,
    requiredQuorum: 1,
    currentQuorum: 1,
    payload: { strategyId: "1", newWeight: 5000, eligibleApprovers: ["role:admin"] },
    idempotencyKey: null,
    expiresAt: null,
    resolvedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 90000000).toISOString(),
  },
];

const MOCK_VOTES: Record<string, { voterId: string; vote: string; comment: string | null; createdAt: string }[]> = {
  "appr-002": [
    { voterId: "demo-user-001", vote: "approve", comment: "Verified the address", createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  "appr-003": [
    { voterId: "demo-user-001", vote: "approve", comment: null, createdAt: new Date(Date.now() - 87000000).toISOString() },
  ],
};

type Tab = "myRequests" | "pendingMyVote" | "all";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  expired: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function ApprovalsPage() {
  const { isDemo, user } = useAuth();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("pendingMyVote");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const approvals = MOCK_APPROVALS;

  const typeLabel = (type: string) => t(`approvals.type.${type}` as TranslationKey);
  const statusLabel = (s: string) => t(`approvals.status.${s}` as TranslationKey);

  const filtered = (() => {
    switch (activeTab) {
      case "myRequests":
        return approvals.filter((a) => a.requestedBy === user?.id || isDemo);
      case "pendingMyVote":
        return approvals.filter((a) => a.status === "pending" || a.status === "in_progress");
      case "all":
        return approvals;
      default:
        return approvals;
    }
  })();

  const canVote = (a: (typeof approvals)[0]) =>
    !submitted[a.id] && (a.status === "pending" || a.status === "in_progress");

  const handleVote = (approvalId: string, vote: string) => {
    if (!vote) return;
    setSubmitted((prev) => ({ ...prev, [approvalId]: true }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">
          {t("approvals.title")}
        </h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">{t("approvals.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] w-fit">
        {(["myRequests", "pendingMyVote", "all"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
              activeTab === tab
                ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            {t(`approvals.tab.${tab}` as TranslationKey)}
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 p-12 text-center">
            <p className="text-[var(--color-muted)]">{t("approvals.noApprovals")}</p>
          </div>
        ) : (
          filtered.map((a) => {
            const isExpanded = expandedId === a.id;
            const approvalVotes = MOCK_VOTES[a.id] || [];
            const currentVote = votes[a.id];

            return (
              <div
                key={a.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-[var(--color-border-light)]"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {typeLabel(a.approvalType)}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full border font-mono",
                          statusColors[a.status]
                        )}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] mt-1 font-mono">
                      {t("approvals.quorum")}: {a.currentQuorum}/{a.requiredQuorum} · {a.id}
                    </p>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] font-mono text-right shrink-0">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--color-border)]/50 pt-4 space-y-4">
                    {/* Payload */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                        {t("approvals.detail.payload")}
                      </h4>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[#080c14]/60 p-3 font-mono text-[13px] text-[var(--color-muted-light)] space-y-1">
                        {Object.entries(a.payload).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-[var(--color-accent)]">{key}:</span>
                            <span>{Array.isArray(val) ? val.join(", ") : String(val)}</span>
                          </div>
                        ))}
                      </div>
                      {a.expiresAt && (
                        <p className="text-[11px] text-[var(--color-muted)] mt-2 font-mono">
                          {t("approvals.detail.expiresAt")}: {new Date(a.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Vote history */}
                    {approvalVotes.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                          {t("approvals.detail.voteHistory")}
                        </h4>
                        <div className="space-y-2">
                          {approvalVotes.map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-[13px]"
                            >
                              <span
                                className={cn(
                                  "text-[11px] px-2 py-0.5 rounded-full font-mono border",
                                  v.vote === "approve"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                )}
                              >
                                {v.vote === "approve" ? t("approvals.vote.approve") : t("approvals.vote.reject")}
                              </span>
                              <span className="text-[var(--color-muted)] font-mono text-[11px]">{v.voterId}</span>
                              {v.comment && (
                                <span className="text-[var(--color-muted)] text-[11px]">— {v.comment}</span>
                              )}
                              <span className="ml-auto text-[11px] text-[var(--color-muted)] font-mono">
                                {new Date(v.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Voting actions */}
                    {canVote(a) && !currentVote && (
                      <div className="pt-2 border-t border-[var(--color-border)]/50 space-y-3">
                        <textarea
                          placeholder={t("approvals.vote.commentPlaceholder")}
                          value={comments[a.id] || ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[#080c14]/60 px-3 py-2 text-[13px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] font-mono resize-none h-16 focus:outline-none focus:border-[var(--color-accent)]/40 transition-colors"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setVotes((prev) => ({ ...prev, [a.id]: "approve" }));
                              handleVote(a.id, "approve");
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-[13px] font-medium border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
                          >
                            {t("approvals.vote.approve")}
                          </button>
                          <button
                            onClick={() => {
                              setVotes((prev) => ({ ...prev, [a.id]: "reject" }));
                              handleVote(a.id, "reject");
                            }}
                            className="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 text-[13px] font-medium border border-red-500/20 hover:bg-red-500/25 transition-colors"
                          >
                            {t("approvals.vote.reject")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Already voted / resolved */}
                    {submitted[a.id] && (
                      <div className="pt-2 border-t border-[var(--color-border)]/50">
                        <p className="text-[12px] text-[var(--color-accent)] font-mono">
                          {t("approvals.vote.success")}
                        </p>
                      </div>
                    )}

                    {/* Cancel button for pending requests */}
                    {a.requestedBy === user?.id && (a.status === "pending" || a.status === "in_progress") && (
                      <div className="pt-2 border-t border-[var(--color-border)]/50">
                        <button className="text-[12px] text-red-400 hover:text-red-300 font-mono transition-colors">
                          {t("approvals.cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
