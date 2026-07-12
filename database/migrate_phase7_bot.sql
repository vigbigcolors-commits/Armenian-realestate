-- Phase 7: Telegram bot for realtors (Pro agents)

ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_mode VARCHAR(20) DEFAULT 'all';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bot_started_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_notify_mode_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_notify_mode_check
            CHECK (notify_mode IN ('all', 'filtered'));
    END IF;
END $$;

UPDATE users SET notify_mode = 'all' WHERE notify_mode IS NULL;
