-- Phase 8: seller accounts, contact privacy, favorites

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS poster_user_id UUID REFERENCES users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(64) NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days'
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (token);
CREATE INDEX IF NOT EXISTS idx_properties_poster ON properties (poster_user_id);

CREATE TABLE IF NOT EXISTS user_favorites (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites (user_id);
