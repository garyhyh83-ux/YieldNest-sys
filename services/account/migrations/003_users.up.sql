-- Migration 003: Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    email CITEXT UNIQUE NOT NULL,
    display_name VARCHAR(150),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'approver', 'auditor')),
    auth_factors JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_enterprise ON users(enterprise_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(enterprise_id, role);
