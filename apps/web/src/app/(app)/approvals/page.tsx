"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n/translations";
import { FileText, Clock, ChevronDown, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

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

const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending: {
    bg: "bg-[var(--color-accent)]/8",
    text: "text-[var(--color-accent)]",
    border: "border-[var(--color-accent)]/15",
    dot: "bg-[var(--color-accent)]",
  },
  in_progress: {
    bg: "bg-[var(--color-primary)]/8",
    text: "text-[var(--color-primary)]",
    border: "border-[var(--color-primary)]/15",
    dot: "bg-[var(--color-primary)]",
  },
  approved: {
    bg: "bg-[var(--color-success)]/8",
    text: "text-[var(--color-success)]",
    border: "border-[var(--color-success)]/15",
    dot: "bg-[var(--color-success)]",
  },
  rejected: {
    bg: "bg-[var(--color-destructive)]/8",
    text: "text-[var(--color-destructive)]",
    border: "border-[var(--color-destructive)]/15",
    dot: "bg-[var(--color-destructive)]",
  },
  cancelled: {
    bg: "bg-[var(--color-muted)]/8",
    text: "text-[var(--color-muted)]",
    border: "border-[var(--color-muted)]/15",
    dot: "bg-[var(--color-muted)]",
  },
  expired: {
    bg: "bg-[var(--color-warning)]/6",
    text: "text-[var(--color-warning)]",
    border: "border-[var(--color-warning)]/12",
    dot: "bg-[var(--color-warning)]",
  },
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
    setVotes((prev) => ({ ...prev, [approvalId]: vote }));
    setSubmitted((prev) => ({ ...prev, [approvalId]: true }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 stagger-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-foreground)]">
          {t("approvals.title")}
        </h1>
        <div className="flex items-center gap-2.5 mt-2">
          <div className="accent-rule" />
          <p className="text-[11px] font-mono text-[var(--color-muted)] tracking-[0.2em] uppercase">
            {t("approvals.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] w-fit">
        {(["myRequests", "pendingMyVote", "all"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 font-mono tracking-wide",
              activeTab === tab
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-foreground)]/3"
            )}
          >
            {t(`approvals.tab.${tab}` as TranslationKey)}
          </button>
        ))}
      </div>

      {/* ── Approval List ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] card-glow p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/8 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-[var(--color-accent)]/25" />
            </div>
            <p className="text-[12px] font-mono text-[var(--color-muted)] tracking-[0.15em] uppercase">
              {t("approvals.noApprovals")}
            </p>
          </div>
        ) : (
          filtered.map((a) => {
            const isExpanded = expandedId === a.id;
            const approvalVotes = MOCK_VOTES[a.id] || [];
            const currentVote = votes[a.id];
            const s = statusStyles[a.status] || statusStyles.pending;

            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-2xl border bg-[var(--color-card)] overflow-hidden transition-all duration-200 card-glow",
                  isExpanded
                    ? "border-[var(--color-border)]"
                    : "border-[var(--color-border)]"
                )}
              >
                {/* ── Summary row ── */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left group"
                >
                  {/* Type icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                    s.bg, s.border
                  )}>
                    <ShieldCheck className={cn("w-4 h-4", s.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {typeLabel(a.approvalType)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-2.5 py-0.5 rounded-full border font-mono tracking-[0.12em] uppercase",
                          s.bg, s.text, s.border
                        )}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] mt-1.5 font-mono tracking-wide">
                      {t("approvals.quorum")}: {a.currentQuorum}/{a.requiredQuorum}
                      <span className="text-[var(--color-border)] mx-2">|</span>
                      {a.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[11px] text-[var(--color-muted)] font-mono">
                        {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                      <div className="text-[10px] text-[var(--color-muted)]/60 font-mono">
                        {new Date(a.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-[var(--color-muted)] transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--color-border)]/40 space-y-5">
                    {/* ── Payload ── */}
                    <div className="pt-4">
                      <h4 className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-[0.18em] mb-3 font-mono">
                        {t("approvals.detail.payload")}
                      </h4>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/70 p-4 font-mono text-[13px] text-[var(--color-muted)] space-y-1.5">
                        {Object.entries(a.payload).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-[var(--color-accent)] shrink-0">{key}:</span>
                            <span className="break-all">{Array.isArray(val) ? val.join(", ") : String(val)}</span>
                          </div>
                        ))}
                      </div>
                      {a.expiresAt && (
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-warning)]/60" />
                          <p className="text-[11px] text-[var(--color-muted)] font-mono">
                            {t("approvals.detail.expiresAt")}: {new Date(a.expiresAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ── Vote history ── */}
                    {approvalVotes.length > 0 && (
                      <div className="pt-3 border-t border-[var(--color-border)]/30">
                        <h4 className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-[0.18em] mb-3 font-mono">
                          {t("approvals.detail.voteHistory")}
                        </h4>
                        <div className="space-y-2">
                          {approvalVotes.map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-background)]/50 border border-[var(--color-border)]/25"
                            >
                              {v.vote === "approve" ? (
                                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-[var(--color-destructive)] shrink-0" />
                              )}
                              <span
                                className={cn(
                                  "text-[11px] px-2.5 py-0.5 rounded-full font-mono border tracking-[0.1em] uppercase",
                                  v.vote === "approve"
                                    ? "bg-[var(--color-success)]/8 text-[var(--color-success)] border-[var(--color-success)]/15"
                                    : "bg-[var(--color-destructive)]/8 text-[var(--color-destructive)] border-[var(--color-destructive)]/15"
                                )}
                              >
                                {v.vote === "approve" ? t("approvals.vote.approve") : t("approvals.vote.reject")}
                              </span>
                              <span className="text-[var(--color-muted)] font-mono text-[11px]">{v.voterId}</span>
                              {v.comment && (
                                <span className="text-[var(--color-muted)]/60 text-[11px] font-mono italic">
                                  &mdash; {v.comment}
                                </span>
                              )}
                              <span className="ml-auto text-[11px] text-[var(--color-muted)]/50 font-mono">
                                {new Date(v.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Voting actions ── */}
                    {canVote(a) && !currentVote && (
                      <div className="pt-3 border-t border-[var(--color-border)]/30 space-y-3">
                        <textarea
                          placeholder={t("approvals.vote.commentPlaceholder")}
                          value={comments[a.id] || ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/70 px-4 py-3 text-[13px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/50 font-mono resize-none h-16 focus:outline-none focus:border-[var(--color-accent)]/40 transition-colors"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleVote(a.id, "approve")}
                            className="flex-1 px-5 py-3 rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)] text-[13px] font-semibold border border-[var(--color-success)]/20 hover:bg-[var(--color-success)]/20 transition-colors font-mono tracking-wider uppercase"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              {t("approvals.vote.approve")}
                            </span>
                          </button>
                          <button
                            onClick={() => handleVote(a.id, "reject")}
                            className="flex-1 px-5 py-3 rounded-xl bg-[var(--color-destructive)]/8 text-[var(--color-destructive)] text-[13px] font-semibold border border-[var(--color-destructive)]/15 hover:bg-[var(--color-destructive)]/15 transition-colors font-mono tracking-wider uppercase"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <XCircle className="w-4 h-4" />
                              {t("approvals.vote.reject")}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Success confirmation ── */}
                    {submitted[a.id] && (
                      <div className="pt-3 border-t border-[var(--color-border)]/30">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-success)]/6 border border-[var(--color-success)]/12">
                          <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                          <p className="text-[12px] text-[var(--color-success)] font-mono tracking-wide">
                            {t("approvals.vote.success")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Cancel button for pending requests ── */}
                    {a.requestedBy === user?.id && (a.status === "pending" || a.status === "in_progress") && (
                      <div className="pt-3 border-t border-[var(--color-border)]/30">
                        <button className="flex items-center gap-2 text-[12px] text-[var(--color-destructive)]/70 hover:text-[var(--color-destructive)] font-mono transition-colors tracking-wide">
                          <XCircle className="w-3.5 h-3.5" />
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
