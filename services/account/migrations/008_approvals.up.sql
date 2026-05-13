-- Migration 008: Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id),
    approval_type VARCHAR(30) NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'expired')),
    required_quorum INTEGER NOT NULL CHECK (required_quorum > 0),
    current_quorum INTEGER NOT NULL DEFAULT 0,
    payload JSONB NOT NULL DEFAULT '{}',
    idempotency_key VARCHAR(64) UNIQUE,
    expires_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_requester ON approvals(requested_by, status);
CREATE INDEX idx_approvals_enterprise ON approvals(enterprise_id, status, created_at DESC);
