-- Migration 014: Seed Data
-- Default strategy definitions for the Strategy Service
CREATE TABLE strategies_def (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    underlying_protocol VARCHAR(100),
    underlying_asset VARCHAR(10),
    expected_apy_min NUMERIC(5, 2),
    expected_apy_max NUMERIC(5, 2),
    risk_level VARCHAR(20),
    withdrawal_delay VARCHAR(50),
    min_amount NUMERIC(78, 6),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO strategies_def (id, name, description, underlying_protocol, underlying_asset, expected_apy_min, expected_apy_max, risk_level, withdrawal_delay, min_amount) VALUES
('treasury_core', 'Treasury Core', 'Short-term US Treasury bills and repos via BlackRock BUIDL', 'BlackRock BUIDL', 'USDC', 4.2, 4.8, 'very_low', '0-1 business day', 10000),
('treasury_plus', 'Treasury Plus', 'Short-term US Treasuries via Ondo USDY', 'Ondo USDY', 'USDC', 4.5, 5.2, 'low', '0-1 business day', 5000),
('defi_prime', 'DeFi Prime', 'Over-collateralized lending on Aave V4', 'Aave V4', 'USDC', 3.5, 6.0, 'low', 'Instant', 1000),
('morpho_optimizer', 'Morpho Optimizer', 'Optimized lending markets via Morpho Blue Vaults', 'Morpho Blue', 'USDC', 4.0, 7.0, 'low_medium', 'Instant', 1000),
('basis_trade', 'Basis Trade', 'Delta-neutral basis trading via Ethena USDe', 'Ethena', 'USDC', 6.0, 12.0, 'medium', '0-7 days', 10000),
('composite', 'Composite', 'Multi-strategy auto-allocation', 'Multiple', 'USDC', 4.0, 6.0, 'low_medium', 'Partial instant', 10000);

-- Default approval policy template for new enterprises
INSERT INTO approval_policies (enterprise_id, policy_type, rules) VALUES
('00000000-0000-0000-0000-000000000000', 'withdrawal', '[
    {"condition": "amount <= 10000", "approvalType": "auto", "quorum": 0, "eligibleApprovers": []},
    {"condition": "amount > 10000 AND amount <= 100000", "approvalType": "single", "quorum": 1, "eligibleApprovers": ["role:treasury_manager"]},
    {"condition": "amount > 100000", "approvalType": "multi", "quorum": 2, "eligibleApprovers": ["role:cfo", "role:ceo"], "requiredApprovers": ["role:cfo"]}
]');

-- OTP codes table (used by Auth Service)
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'email_verification'
        CHECK (purpose IN ('email_verification', 'login', 'recovery')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_email_purpose ON otp_codes(email, purpose);
