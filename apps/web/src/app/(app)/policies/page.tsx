"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { Shield, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

// ── Types ──
type ApprovalType = "withdrawal" | "whitelist_change" | "role_change" | "strategy_change" | "account_recovery";
type RuleApproval = "auto" | "single" | "multi";

interface PolicyRule {
  condition: string;
  approvalType: RuleApproval;
  quorum: number;
  eligibleApprovers: string[];
  requiredApprovers: string[];
}

interface Policy {
  id: string;
  enterpriseId: string;
  policyType: ApprovalType;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}

// ── Demo data ──
const MOCK_POLICIES: Policy[] = [
  {
    id: "pol-001",
    enterpriseId: "demo-enterprise-001",
    policyType: "withdrawal",
    rules: [
      { condition: "amount <= 10000", approvalType: "auto", quorum: 0, eligibleApprovers: [], requiredApprovers: [] },
      { condition: "amount > 10000 AND amount <= 100000", approvalType: "single", quorum: 1, eligibleApprovers: ["role:treasury_manager"], requiredApprovers: [] },
      { condition: "amount > 100000", approvalType: "multi", quorum: 2, eligibleApprovers: ["role:cfo", "role:ceo"], requiredApprovers: ["role:cfo"] },
    ],
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-15T00:00:00Z",
  },
  {
    id: "pol-002",
    enterpriseId: "demo-enterprise-001",
    policyType: "whitelist_change",
    rules: [
      { condition: "true", approvalType: "multi", quorum: 2, eligibleApprovers: ["role:cfo", "role:ceo"], requiredApprovers: [] },
    ],
    createdAt: "2026-05-10T00:00:00Z",
    updatedAt: "2026-05-10T00:00:00Z",
  },
];

const POLICY_TYPE_LABELS: Record<ApprovalType, string> = {
  withdrawal: "Withdrawal",
  whitelist_change: "Whitelist Change",
  role_change: "Role Change",
  strategy_change: "Strategy Change",
  account_recovery: "Account Recovery",
};

const APPROVAL_TYPE_OPTIONS: { value: RuleApproval; labelKey: TranslationKey }[] = [
  { value: "auto", labelKey: "policies.rule.auto" },
  { value: "single", labelKey: "policies.rule.single" },
  { value: "multi", labelKey: "policies.rule.multi" },
];

function emptyRule(): PolicyRule {
  return { condition: "amount <= 10000", approvalType: "auto", quorum: 0, eligibleApprovers: [], requiredApprovers: [] };
}

export default function PoliciesPage() {
  const { isDemo } = useAuth();
  const { t } = useLocale();

  const [policies, setPolicies] = useState<Policy[]>(MOCK_POLICIES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Policy | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<ApprovalType>("withdrawal");
  const [createRules, setCreateRules] = useState<PolicyRule[]>([emptyRule()]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  // ── Edit mode ──
  const startEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setEditData(JSON.parse(JSON.stringify(policy)));
  };
  const cancelEdit = () => { setEditingId(null); setEditData(null); };

  const updateEditRule = (idx: number, field: string, value: unknown) => {
    if (!editData) return;
    const rules = [...editData.rules];
    (rules[idx] as unknown as Record<string, unknown>)[field] = value;
    setEditData({ ...editData, rules });
  };

  const updateEditRuleApprovers = (idx: number, field: string, value: string) => {
    if (!editData) return;
    const rules = [...editData.rules];
    (rules[idx] as unknown as Record<string, unknown>)[field] = value.split(",").map((s: string) => s.trim()).filter(Boolean);
    setEditData({ ...editData, rules });
  };

  const saveEdit = () => {
    if (!editData) return;
    setPolicies((prev) => prev.map((p) => (p.id === editData.id ? editData : p)));
    setEditingId(null);
    setEditData(null);
  };

  const deletePolicy = (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  // ── Create mode ──
  const addCreateRule = () => setCreateRules([...createRules, emptyRule()]);
  const removeCreateRule = (idx: number) => {
    if (createRules.length <= 1) return;
    setCreateRules(createRules.filter((_, i) => i !== idx));
  };
  const updateCreateRule = (idx: number, field: string, value: unknown) => {
    const rules = [...createRules];
    (rules[idx] as unknown as Record<string, unknown>)[field] = value;
    setCreateRules(rules);
  };

  const submitCreate = () => {
    const newPolicy: Policy = {
      id: `pol-${Date.now()}`,
      enterpriseId: "demo-enterprise-001",
      policyType: createType,
      rules: createRules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPolicies([newPolicy, ...policies]);
    setShowCreate(false);
    setCreateRules([emptyRule()]);
  };

  // ── Render ──
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-foreground)]">{t("policies.title")}</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">{t("policies.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[13px] font-medium border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/25 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("policies.create")}
        </button>
      </div>

      {isDemo && (
        <div className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/15 text-[12px] text-[var(--color-muted-light)] font-mono">
          {t("policies.demo")}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-card)]/90 backdrop-blur-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[var(--color-accent)]" />
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as ApprovalType)}
              className="rounded-lg border border-[var(--color-border)] bg-[#080c14] px-3 py-2 text-[13px] text-[var(--color-foreground)] font-mono focus:outline-none focus:border-[var(--color-accent)]/40"
            >
              {(Object.keys(POLICY_TYPE_LABELS) as ApprovalType[]).map((pt) => (
                <option key={pt} value={pt}>{POLICY_TYPE_LABELS[pt]}</option>
              ))}
            </select>
            <span className="text-[11px] text-[var(--color-muted)] font-mono">New Policy</span>
          </div>

          {createRules.map((rule, i) => (
            <RuleEditor
              key={i}
              rule={rule}
              index={i}
              total={createRules.length}
              onChange={(f, v) => updateCreateRule(i, f, v)}
              onRemove={() => removeCreateRule(i)}
              t={t}
            />
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
            <button onClick={addCreateRule} className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-mono transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t("policies.addRule")}
            </button>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-[12px] text-[var(--color-muted)] font-mono hover:text-[var(--color-foreground)] transition-colors">
                Cancel
              </button>
              <button onClick={submitCreate} className="px-5 py-2 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[12px] font-medium border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/25 transition-colors">
                {t("policies.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy list */}
      {policies.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 p-12 text-center">
          <Shield className="w-10 h-10 text-[var(--color-muted)]/30 mx-auto mb-3" />
          <p className="text-[var(--color-muted)] text-sm max-w-md mx-auto">{t("policies.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => {
            const isExpanded = expandedId === policy.id;
            const isEditing = editingId === policy.id;
            const display = isEditing && editData ? editData : policy;

            return (
              <div key={policy.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-[var(--color-border-light)]">
                {/* Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(policy.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") toggleExpand(policy.id); }}
                  className="w-full px-5 py-4 flex items-center gap-3 text-left cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {POLICY_TYPE_LABELS[policy.policyType]}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)] font-mono">
                        {policy.rules.length} rule{policy.rules.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(policy); setExpandedId(policy.id); }}
                      className="text-[11px] text-[var(--color-muted)] hover:text-[var(--color-accent)] font-mono transition-colors px-2 py-1"
                    >
                      {t("policies.edit")}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }}
                      className="text-[11px] text-[var(--color-muted)] hover:text-red-400 font-mono transition-colors px-2 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-muted)]" />}
                  </div>
                </div>

                {/* Expanded rules */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--color-border)]/50 pt-4 space-y-3">
                    {isEditing ? (
                      <>
                        {display.rules.map((rule, i) => (
                          <RuleEditor
                            key={i}
                            rule={rule}
                            index={i}
                            total={display.rules.length}
                            onChange={(field, value) => {
                              if (field === "eligibleApprovers" || field === "requiredApprovers") {
                                updateEditRuleApprovers(i, field, value as string);
                              } else {
                                updateEditRule(i, field, value);
                              }
                            }}
                            onRemove={() => {
                              if (display.rules.length <= 1) return;
                              const rules = display.rules.filter((_, idx) => idx !== i);
                              setEditData({ ...editData!, rules });
                            }}
                            t={t}
                          />
                        ))}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                          <button
                            onClick={() => {
                              if (!editData) return;
                              setEditData({ ...editData, rules: [...editData.rules, emptyRule()] });
                            }}
                            className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-mono transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> {t("policies.addRule")}
                          </button>
                          <div className="flex gap-2">
                            <button onClick={cancelEdit} className="px-4 py-2 rounded-lg text-[12px] text-[var(--color-muted)] font-mono hover:text-[var(--color-foreground)] transition-colors">
                              Cancel
                            </button>
                            <button onClick={saveEdit} className="px-5 py-2 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[12px] font-medium border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/25 transition-colors">
                              {t("policies.save")}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {policy.rules.map((rule, i) => (
                          <RuleReadonly key={i} rule={rule} index={i} t={t} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Inline rule editor ──
function RuleEditor({
  rule,
  index,
  total,
  onChange,
  onRemove,
  t,
}: {
  rule: PolicyRule;
  index: number;
  total: number;
  onChange: (field: string, value: unknown) => void;
  onRemove: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[#080c14]/60 p-4 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider font-mono">
          Rule {index + 1}
        </span>
        {total > 1 && (
          <button onClick={onRemove} className="text-[11px] text-red-400/60 hover:text-red-400 font-mono transition-colors">
            {t("policies.removeRule")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Condition */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1 font-mono">
            {t("policies.rule.condition")}
          </label>
          <input
            value={rule.condition}
            onChange={(e) => onChange("condition", e.target.value)}
            placeholder={t("policies.rule.conditionHelp")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[#080c14] px-3 py-2 text-[13px] text-[var(--color-foreground)] font-mono focus:outline-none focus:border-[var(--color-accent)]/40 transition-colors placeholder:text-[var(--color-muted)]/50"
          />
        </div>

        {/* Approval type */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1 font-mono">
            {t("policies.rule.approvalType")}
          </label>
          <select
            value={rule.approvalType}
            onChange={(e) => {
              const v = e.target.value as RuleApproval;
              onChange("approvalType", v);
              if (v === "auto") onChange("quorum", 0);
            }}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[#080c14] px-3 py-2 text-[13px] text-[var(--color-foreground)] font-mono focus:outline-none focus:border-[var(--color-accent)]/40"
          >
            {APPROVAL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
        </div>

        {/* Quorum */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1 font-mono">
            {t("policies.rule.quorum")}
          </label>
          <input
            type="number"
            min={rule.approvalType === "auto" ? 0 : 1}
            max={10}
            value={rule.quorum}
            disabled={rule.approvalType === "auto"}
            onChange={(e) => onChange("quorum", parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[#080c14] px-3 py-2 text-[13px] text-[var(--color-foreground)] font-mono focus:outline-none focus:border-[var(--color-accent)]/40 disabled:opacity-30"
          />
        </div>

        {/* Eligible approvers */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1 font-mono">
            {t("policies.rule.eligibleApprovers")}
          </label>
          <input
            value={rule.eligibleApprovers.join(", ")}
            onChange={(e) => onChange("eligibleApprovers", e.target.value)}
            placeholder={t("policies.rule.eligibleHelp")}
            disabled={rule.approvalType === "auto"}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[#080c14] px-3 py-2 text-[13px] text-[var(--color-foreground)] font-mono focus:outline-none focus:border-[var(--color-accent)]/40 disabled:opacity-30 placeholder:text-[var(--color-muted)]/50"
          />
        </div>

        {/* Required approvers */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1 font-mono">
            {t("policies.rule.requiredApprovers")}
          </label>
          <input
            value={rule.requiredApprovers.join(", ")}
            onChange={(e) => onChange("requiredApprovers", e.target.value)}
            placeholder={t("policies.rule.requiredHelp")}
            disabled={rule.approvalType === "auto"}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[#080c14] px-3 py-2 text-[13px] text-[var(--color-foreground)] font-mono focus:outline-none focus:border-[var(--color-accent)]/40 disabled:opacity-30 placeholder:text-[var(--color-muted)]/50"
          />
        </div>
      </div>
    </div>
  );
}

// ── Read-only rule display ──
function RuleReadonly({
  rule,
  index,
  t,
}: {
  rule: PolicyRule;
  index: number;
  t: (key: TranslationKey) => string;
}) {
  const approvalLabel = t(`policies.rule.${rule.approvalType}` as TranslationKey);

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--color-background)]/50 border border-[var(--color-border)]/50">
      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-mono font-bold text-[var(--color-accent)]">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
        <div>
          <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider font-mono">Condition</span>
          <p className="text-[12px] font-mono text-[var(--color-foreground)] truncate">{rule.condition}</p>
        </div>
        <div>
          <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider font-mono">Type</span>
          <p className="text-[12px] font-mono text-[var(--color-foreground)]">{approvalLabel}</p>
        </div>
        <div>
          <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider font-mono">Quorum</span>
          <p className="text-[12px] font-mono text-[var(--color-foreground)]">{rule.quorum}</p>
        </div>
        <div>
          <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider font-mono">Approvers</span>
          <p className="text-[12px] font-mono text-[var(--color-foreground)] truncate">
            {rule.approvalType === "auto" ? "—" : rule.eligibleApprovers.join(", ") || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
