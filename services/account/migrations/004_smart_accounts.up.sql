-- Migration 004: Smart Accounts
CREATE TABLE smart_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id),
    chain_id INTEGER NOT NULL,
    account_address VARCHAR(42) NOT NULL,
    safe_version VARCHAR(10),
    owners JSONB NOT NULL DEFAULT '[]',
    threshold INTEGER NOT NULL DEFAULT 1,
    factory_salt BYTEA,
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(chain_id, account_address),
    UNIQUE(enterprise_id, chain_id)
);

CREATE INDEX idx_sa_enterprise ON smart_accounts(enterprise_id);
