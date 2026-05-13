-- Migration 002: Enterprises
CREATE TABLE enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    country CHAR(2) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    kyb_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    kyb_provider_ref VARCHAR(255),
    risk_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enterprises_kyb_status ON enterprises(kyb_status);
CREATE INDEX idx_enterprises_country ON enterprises(country);
