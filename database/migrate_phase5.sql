-- Phase 5: подписки на цену + системный статус

CREATE TABLE IF NOT EXISTS price_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    telegram_id     BIGINT NOT NULL,
    deal_type       VARCHAR(10) NOT NULL DEFAULT 'rent'
                    CHECK (deal_type IN ('rent', 'sale')),
    district        VARCHAR(100),
    rooms           SMALLINT,
    price_max_usd   INTEGER,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (telegram_id, deal_type, district, rooms, price_max_usd)
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts (is_active, deal_type);
CREATE INDEX IF NOT EXISTS idx_price_alerts_telegram ON price_alerts (telegram_id);

CREATE TRIGGER set_updated_at_price_alerts
    BEFORE UPDATE ON price_alerts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
