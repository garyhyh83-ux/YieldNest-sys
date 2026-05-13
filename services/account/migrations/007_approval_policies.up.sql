-- Migration 007: Approval Policies
CREATE TABLE approval_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    policy_type VARCHAR(30) NOT NULL
        CHECK (policy_type IN ('withdrawal', 'whitelist_change', 'role_change', 'strategy_change', 'account_recovery')),
    rules JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ap_enterprise_type ON approval_policies(enterprise_id, policy_type);
