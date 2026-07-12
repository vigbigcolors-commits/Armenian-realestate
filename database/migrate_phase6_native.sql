-- Phase 6: нативная публикация объявлений (без list.am в ленте)
-- Существующие объекты помечаются aggregated и не показываются.

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS source_origin VARCHAR(20) NOT NULL DEFAULT 'aggregated'
        CHECK (source_origin IN ('aggregated', 'native'));

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'approved'
        CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);

-- Все старые записи с парсера — aggregated (скрыты из ленты)
UPDATE properties SET source_origin = 'aggregated' WHERE source_origin IS NULL OR source_origin = 'aggregated';

CREATE INDEX IF NOT EXISTS idx_properties_native_feed
    ON properties (deal_type, status, moderation_status, source_origin)
    WHERE source_origin = 'native' AND status = 'active';
