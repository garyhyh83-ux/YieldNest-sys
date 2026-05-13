-- Migration 006: Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id),
    smart_account_id UUID REFERENCES smart_accounts(id),
    tx_type VARCHAR(30) NOT NULL CHECK (tx_type IN ('deposit', 'withdraw', 'yield', 'fee', 'gas')),
    asset VARCHAR(10) NOT NULL,
    amount NUMERIC(78, 18) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('in', 'out')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'processing', 'confirmed', 'failed', 'cancelled')),
    chain_tx_hash VARCHAR(66),
    userop_hash VARCHAR(66),
    approval_id UUID,
    idempotency_key VARCHAR(64) UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_tx_enterprise_status ON transactions(enterprise_id, status, created_at DESC);
CREATE INDEX idx_tx_chain_hash ON transactions(chain_tx_hash);
CREATE INDEX idx_tx_type ON transactions(enterprise_id, tx_type, created_at DESC);
