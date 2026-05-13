-- Migration 010: Yield Records
CREATE TABLE yield_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id),
    strategy_id VARCHAR(50) NOT NULL,
    snapshot_amount NUMERIC(78, 18) NOT NULL,
    gross_yield NUMERIC(78, 18) NOT NULL,
    fee_amount NUMERIC(78, 18) NOT NULL,
    net_yield NUMERIC(78, 18) NOT NULL,
    apy_bps INTEGER NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_yield_enterprise_date ON yield_records(enterprise_id, record_date DESC);
CREATE UNIQUE INDEX idx_yield_unique ON yield_records(enterprise_id, strategy_id, record_date);
