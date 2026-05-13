-- Migration 005: Whitelist Addresses
CREATE TABLE whitelist_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    label VARCHAR(255),
    added_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(enterprise_id, address)
);

CREATE INDEX idx_wl_enterprise ON whitelist_addresses(enterprise_id);
