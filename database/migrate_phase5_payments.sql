-- Phase 5/6: оплата контакта собственника (4000 AMD) + веб-клиенты

CREATE TABLE IF NOT EXISTS contact_unlocks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    client_token    VARCHAR(64) NOT NULL,
    amount_amd      INTEGER NOT NULL DEFAULT 4000,
    payment_method  VARCHAR(30) NOT NULL DEFAULT 'demo',
    payment_ref     VARCHAR(120),
    UNIQUE (property_id, client_token)
);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_token ON contact_unlocks (client_token);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_property ON contact_unlocks (property_id);

CREATE TABLE IF NOT EXISTS payment_intents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_token    VARCHAR(64),
    telegram_id     BIGINT,
    intent_type     VARCHAR(30) NOT NULL CHECK (intent_type IN ('contact_unlock', 'pro_subscription')),
    property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
    amount_amd      INTEGER NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    provider        VARCHAR(30) DEFAULT 'idram',
    provider_ref    VARCHAR(120)
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents (status, created_at DESC);
