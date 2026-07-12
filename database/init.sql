-- SmartEstate Armenia — Схема базы данных
-- Принцип: разделяем ОБЪЕКТ (физическая квартира) и ОБЪЯВЛЕНИЕ (запись на сайте)
-- Это позволяет хранить всю историю изменений цен по одной квартире

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- для быстрого текстового поиска


-- ─────────────────────────────────────────────────────────────
-- 1. PROPERTIES — эталонные уникальные объекты недвижимости
--    Создается ПОСЛЕ склейки дубликатов алгоритмом-санитаром
-- ─────────────────────────────────────────────────────────────
CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Физические параметры
    property_type   VARCHAR(20) NOT NULL CHECK (property_type IN ('apartment','house','commercial','land')),
    deal_type       VARCHAR(10) NOT NULL CHECK (deal_type IN ('sale','rent')),

    -- Адрес и координаты
    district        VARCHAR(100),        -- Аванский, Центр, Арабкир...
    street          VARCHAR(200),
    building_number VARCHAR(20),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),

    -- Характеристики
    rooms           SMALLINT,
    floor           SMALLINT,
    total_floors    SMALLINT,
    area_sqm        DECIMAL(8, 2),
    area_land_sqm   DECIMAL(8, 2),       -- для домов

    -- Текущее состояние
    current_price_usd   INTEGER,         -- всегда в USD для единообразия
    owner_price_usd     INTEGER,         -- цена от собственника (если известна)
    is_owner_verified   BOOLEAN DEFAULT FALSE,
    owner_phone         VARCHAR(30),

    -- Медиа и контент (продвигается из listings санитаром)
    photo_urls          TEXT[],
    title               TEXT,
    description_raw     TEXT,
    description_clean   JSONB,             -- {"hy":"...","ru":"...","en":"..."}

    -- Технические поля
    fingerprint     VARCHAR(64) UNIQUE,  -- хэш для дедупликации (из фото+параметры)
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','sold','rented')),
    duplicate_count SMALLINT DEFAULT 0   -- сколько дублей найдено
);

-- Индексы для быстрого поиска на карте и по фильтрам
CREATE INDEX idx_properties_geo      ON properties (latitude, longitude);
CREATE INDEX idx_properties_district ON properties (district);
CREATE INDEX idx_properties_type     ON properties (deal_type, property_type);
CREATE INDEX idx_properties_price    ON properties (current_price_usd);
CREATE INDEX idx_properties_rooms    ON properties (rooms);
CREATE INDEX idx_properties_status   ON properties (status);


-- ─────────────────────────────────────────────────────────────
-- 2. LISTINGS — сырые объявления с сайтов (грязная руда)
--    Каждый раз когда парсер находит объявление — оно сюда
-- ─────────────────────────────────────────────────────────────
CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Привязка к эталонному объекту (NULL пока санитар не склеил)
    property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,

    -- Источник
    source_site     VARCHAR(50) NOT NULL,   -- 'list.am', 'myhome.am', 'realty.am'
    source_url      TEXT NOT NULL UNIQUE,
    external_id     VARCHAR(100),           -- ID объявления на исходном сайте

    -- Данные объявления
    title           TEXT,
    description     TEXT,
    price_amd       BIGINT,                 -- цена в драмах как указана
    price_usd       INTEGER,                -- конвертированная в USD
    currency        VARCHAR(5),             -- 'AMD', 'USD'

    -- Контакт из объявления
    poster_phone    VARCHAR(30),
    poster_name     VARCHAR(200),
    is_agency       BOOLEAN DEFAULT FALSE,  -- определяется по паттернам

    -- Параметры из объявления
    rooms           SMALLINT,
    floor           SMALLINT,
    total_floors    SMALLINT,
    area_sqm        DECIMAL(8, 2),
    district        VARCHAR(100),
    address_raw     TEXT,                   -- адрес как указан на сайте

    -- Фото (храним URL, не файлы)
    photo_urls      TEXT[],
    photo_hash      VARCHAR(64),            -- перцептивный хэш первого фото для дедупликации

    -- Техническое
    raw_data        JSONB,                  -- полный JSON ответа (для отладки)
    dedup_status    VARCHAR(20) DEFAULT 'pending'
                    CHECK (dedup_status IN ('pending','processed','duplicate','original')),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_listings_property    ON listings (property_id);
CREATE INDEX idx_listings_source      ON listings (source_site, external_id);
CREATE INDEX idx_listings_phone       ON listings (poster_phone);
CREATE INDEX idx_listings_dedup       ON listings (dedup_status);
CREATE INDEX idx_listings_scraped     ON listings (scraped_at DESC);
CREATE INDEX idx_listings_text        ON listings USING GIN (to_tsvector('russian', coalesce(title,'') || ' ' || coalesce(description,'')));


-- ─────────────────────────────────────────────────────────────
-- 3. PRICE_HISTORY — архив всех изменений цены
--    Это ядро прозрачности: показывает динамику на графике
-- ─────────────────────────────────────────────────────────────
CREATE TABLE price_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,

    price_usd       INTEGER NOT NULL,
    price_amd       BIGINT,
    source_site     VARCHAR(50),
    poster_phone    VARCHAR(30),    -- чей это прайс (собственник или агент)
    note            TEXT            -- 'Снижение цены', 'Новый дубликат от агента X'
);

CREATE INDEX idx_price_history_property  ON price_history (property_id, recorded_at DESC);
CREATE INDEX idx_price_history_time      ON price_history (recorded_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 4. USERS — зарегистрированные пользователи
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    telegram_id     BIGINT UNIQUE,
    phone           VARCHAR(30),
    email           VARCHAR(200),

    role            VARCHAR(20) DEFAULT 'buyer'
                    CHECK (role IN ('buyer','agent','owner','admin')),
    plan            VARCHAR(20) DEFAULT 'free'
                    CHECK (plan IN ('free','pro')),
    plan_expires_at TIMESTAMPTZ,

    -- Для агентов
    agency_name     VARCHAR(200),
    is_verified     BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_telegram ON users (telegram_id);
CREATE INDEX idx_users_plan     ON users (plan, plan_expires_at);


-- ─────────────────────────────────────────────────────────────
-- 5. UNLOCKED_CONTACTS — кто и когда купил контакт собственника
-- ─────────────────────────────────────────────────────────────
CREATE TABLE unlocked_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    user_id         UUID NOT NULL REFERENCES users(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    amount_amd      INTEGER NOT NULL DEFAULT 4000,

    UNIQUE (user_id, property_id)   -- нельзя купить один контакт дважды
);


-- ─────────────────────────────────────────────────────────────
-- 6. SCRAPE_LOGS — лог работы парсера (мониторинг)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE scrape_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,

    source_site     VARCHAR(50),
    pages_scraped   INTEGER DEFAULT 0,
    listings_found  INTEGER DEFAULT 0,
    new_listings    INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    errors          TEXT[],
    status          VARCHAR(20) DEFAULT 'running'
                    CHECK (status IN ('running','success','error'))
);


-- ─────────────────────────────────────────────────────────────
-- Функция: автоматически обновляет updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_properties
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_listings
    BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
