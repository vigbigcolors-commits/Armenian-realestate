-- Phase 4: медиа и очищенные описания на уровне properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_raw TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_clean JSONB;

CREATE INDEX IF NOT EXISTS idx_properties_photos ON properties USING GIN (photo_urls);

-- Backfill медиа из лучшего listing на объект
UPDATE properties p
SET
    photo_urls = COALESCE(p.photo_urls, sub.photo_urls),
    title = COALESCE(p.title, sub.title),
    description_raw = COALESCE(p.description_raw, sub.description)
FROM (
    SELECT DISTINCT ON (property_id)
        property_id,
        photo_urls,
        title,
        description
    FROM listings
    WHERE property_id IS NOT NULL
    ORDER BY property_id,
        CASE WHEN dedup_status = 'original' THEN 0 ELSE 1 END,
        CASE WHEN is_agency = FALSE THEN 0 ELSE 1 END,
        scraped_at DESC
) sub
WHERE p.id = sub.property_id;
