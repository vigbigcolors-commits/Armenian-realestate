-- Демо-данные для Фазы 2 (пока парсер не собрал реальные объявления)
-- Запуск: docker compose exec postgres psql -U smartestate -d smartestate -f /docker-entrypoint-initdb.d/seed_demo.sql
-- Или: psql через volume mount

-- Очистка демо (безопасно — только если таблицы пустые или пересоздаём)
-- TRUNCATE price_history, listings, properties CASCADE;

INSERT INTO properties (
    id, property_type, deal_type, district, street, building_number,
    latitude, longitude, rooms, floor, total_floors, area_sqm,
    current_price_usd, owner_price_usd, is_owner_verified, owner_phone,
    fingerprint, status, duplicate_count
) VALUES
(
    'a1000001-0000-4000-8000-000000000001',
    'apartment', 'rent', 'Арабкир', 'ул. Арама Хачатуряна', '12',
    40.205100, 44.505200, 2, 5, 9, 68.0,
    750, 700, true, '37491123456',
    'demo_fp_arabkir_2k', 'active', 3
),
(
    'a1000001-0000-4000-8000-000000000002',
    'apartment', 'rent', 'Центр', 'ул. Амиряна', '4',
    40.179500, 44.515800, 3, 3, 5, 95.0,
    1100, 950, true, '37497777888',
    'demo_fp_center_3k', 'active', 5
),
(
    'a1000001-0000-4000-8000-000000000003',
    'apartment', 'sale', 'Аван', 'ул. Маршала Баграмяна', '45',
    40.220300, 44.570100, 2, 8, 16, 72.0,
    85000, 82000, false, NULL,
    'demo_fp_avan_2k_sale', 'active', 2
),
(
    'a1000001-0000-4000-8000-000000000004',
    'apartment', 'rent', 'Нор Норк', 'ул. Гарегина Нжде', '22',
    40.195200, 44.565400, 1, 4, 12, 42.0,
    450, 400, true, '37493333444',
    'demo_fp_nornork_1k', 'active', 4
),
(
    'a1000001-0000-4000-8000-000000000005',
    'apartment', 'sale', 'Центр', 'ул. Туманяна', '8',
    40.181200, 44.513500, 3, 6, 10, 110.0,
    130000, 115000, false, NULL,
    'demo_fp_tumanyan_sale', 'active', 6
),
(
    'a1000001-0000-4000-8000-000000000006',
    'apartment', 'rent', 'Канакер-Зейтун', 'ул. Руставели', '15',
    40.188500, 44.528900, 2, 2, 5, 65.0,
    600, 550, true, '37495555666',
    'demo_fp_kanaker_2k', 'active', 2
)
ON CONFLICT (fingerprint) DO NOTHING;

-- Объявления (дубликаты от агентов)
INSERT INTO listings (
    id, property_id, source_site, source_url, external_id,
    title, price_usd, price_amd, currency, poster_phone, poster_name,
    is_agency, rooms, floor, area_sqm, district, address_raw,
    dedup_status, is_active
) VALUES
('b2000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001', 'list.am', 'https://www.list.am/item/demo1-owner', 'demo1o',
 '2-комн. Арабкир, светлая', 700, 273000, 'USD', '37491123456', 'Армен', false, 2, 5, 68, 'Арабкир', 'ул. Арама Хачатуряна 12', 'original', true),
('b2000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000001', 'list.am', 'https://www.list.am/item/demo1-agent1', 'demo1a1',
 'Супер квартира Арабкир центр', 820, 319800, 'USD', '37499001122', 'Elite Realty', true, 2, 5, 68, 'Арабкир', 'Арабкир', 'duplicate', true),
('b2000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000001', 'list.am', 'https://www.list.am/item/demo1-agent2', 'demo1a2',
 'Эксклюзив 2к Арабкир', 780, 304200, 'USD', '37499003344', 'HomePro Agency', true, 2, 5, 68, 'Арабкир', 'Арабкир', 'duplicate', true),

('b2000001-0000-4000-8000-000000000004', 'a1000001-0000-4000-8000-000000000002', 'list.am', 'https://www.list.am/item/demo2-owner', 'demo2o',
 '3-комн. Центр, Амирян 4', 950, 370500, 'USD', '37497777888', 'Сона', false, 3, 3, 95, 'Центр', 'ул. Амиряна 4', 'original', true),
('b2000001-0000-4000-8000-000000000005', 'a1000001-0000-4000-8000-000000000002', 'list.am', 'https://www.list.am/item/demo2-agent1', 'demo2a1',
 'Люкс 3к Центр срочно', 1100, 429000, 'USD', '37499112233', 'Premium Estate', true, 3, 3, 95, 'Центр', 'Центр', 'duplicate', true),
('b2000001-0000-4000-8000-000000000006', 'a1000001-0000-4000-8000-000000000002', 'list.am', 'https://www.list.am/item/demo2-agent2', 'demo2a2',
 '3 комнаты центр эксклюзив', 1050, 409500, 'USD', '37499334455', 'Ашот Риелтор', true, 3, 3, 95, 'Центр', 'Центр', 'duplicate', true),

('b2000001-0000-4000-8000-000000000007', 'a1000001-0000-4000-8000-000000000005', 'list.am', 'https://www.list.am/item/demo5-agent1', 'demo5a1',
 'Срочно! Туманяна 3к ниже рынка', 130000, 50700000, 'USD', '37499556677', 'Ашот Риелтор', true, 3, 6, 110, 'Центр', 'ул. Туманяна', 'duplicate', true)
ON CONFLICT (source_url) DO NOTHING;

-- История цен
INSERT INTO price_history (property_id, listing_id, price_usd, source_site, poster_phone, note, recorded_at) VALUES
('a1000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000001', 700, 'list.am', '37491123456', 'Собственник', NOW() - INTERVAL '14 days'),
('a1000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000002', 820, 'list.am', '37499001122', 'Агентство Elite Realty', NOW() - INTERVAL '10 days'),
('a1000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000003', 780, 'list.am', '37499003344', 'Агентство HomePro', NOW() - INTERVAL '5 days'),

('a1000001-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000004', 950, 'list.am', '37497777888', 'Собственник', NOW() - INTERVAL '20 days'),
('a1000001-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000005', 1100, 'list.am', '37499112233', 'Premium Estate +$150', NOW() - INTERVAL '12 days'),
('a1000001-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000006', 1050, 'list.am', '37499334455', 'Ашот +$100', NOW() - INTERVAL '7 days'),

('a1000001-0000-4000-8000-000000000005', NULL, 120000, 'list.am', NULL, 'Январь — собственник', NOW() - INTERVAL '150 days'),
('a1000001-0000-4000-8000-000000000005', NULL, 110000, 'list.am', NULL, 'Март — снижение цены', NOW() - INTERVAL '90 days'),
('a1000001-0000-4000-8000-000000000005', 'b2000001-0000-4000-8000-000000000007', 130000, 'list.am', '37499556677', 'Июнь — риелтор Ашот +$20k', NOW() - INTERVAL '15 days');
