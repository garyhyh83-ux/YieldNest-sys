-- Migration 009: Approval Votes
CREATE TABLE approval_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id),
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('approve', 'reject')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(approval_id, voter_id)
);

CREATE INDEX idx_av_approval ON approval_votes(approval_id);
