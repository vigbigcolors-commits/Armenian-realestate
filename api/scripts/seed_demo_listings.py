#!/usr/bin/env python3
"""
Seed 16 demo native listings (8 sale + 8 rent), each with 2 photos.
Run: docker compose exec api python scripts/seed_demo_listings.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import asyncpg

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
AMD_TO_USD = int(os.getenv("AMD_TO_USD_RATE", "390"))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://smartestate:changeme@postgres:5432/smartestate",
)

SALE_LISTINGS = [
    {"title": "3-комн. в Центре, светлая", "district": "Центр", "street": "ул. Абовяна 12", "rooms": 3, "floor": 5, "total_floors": 9, "area_sqm": 78, "price_amd": 85_000_000, "property_type": "apartment"},
    {"title": "2-комн. у Оперного театра", "district": "Центр", "street": "ул. Саят-Новы 7", "rooms": 2, "floor": 3, "total_floors": 5, "area_sqm": 54, "price_amd": 62_000_000, "property_type": "apartment"},
    {"title": "Пентхаус с видом на Арарат", "district": "Арабкир", "street": "пр. Баграмяна 45", "rooms": 4, "floor": 12, "total_floors": 12, "area_sqm": 145, "price_amd": 195_000_000, "property_type": "apartment"},
    {"title": "Дом с садом в Аване", "district": "Аван", "street": "ул. Аван 18", "rooms": 5, "floor": 2, "total_floors": 2, "area_sqm": 220, "price_amd": 120_000_000, "property_type": "house"},
    {"title": "Студия у метро", "district": "Кентрон", "street": "ул. Туманяна 3", "rooms": 1, "floor": 7, "total_floors": 16, "area_sqm": 32, "price_amd": 48_000_000, "property_type": "apartment"},
    {"title": "Офис в бизнес-центре", "district": "Кентрон", "street": "ул. Амиряна 25", "rooms": None, "floor": 4, "total_floors": 8, "area_sqm": 95, "price_amd": 75_000_000, "property_type": "commercial"},
    {"title": "Участок под застройку", "district": "Нор Норк", "street": "ул. Гарегина Нжде 88", "rooms": None, "floor": None, "total_floors": None, "area_sqm": 600, "price_amd": 55_000_000, "property_type": "land"},
    {"title": "4-комн. после ремонта", "district": "Давташен", "street": "ул. Давташен 4-я 11", "rooms": 4, "floor": 8, "total_floors": 10, "area_sqm": 102, "price_amd": 98_000_000, "property_type": "apartment"},
]

RENT_LISTINGS = [
    {"title": "Сдаётся 2-комн. в Центре", "district": "Центр", "street": "ул. Пушкина 9", "rooms": 2, "floor": 4, "total_floors": 6, "area_sqm": 58, "price_amd": 350_000, "property_type": "apartment"},
    {"title": "Студия у парка", "district": "Кентрон", "street": "ул. Московяна 15", "rooms": 1, "floor": 2, "total_floors": 5, "area_sqm": 28, "price_amd": 220_000, "property_type": "apartment"},
    {"title": "3-комн. с мебелью", "district": "Арабкир", "street": "ул. Киевян 22", "rooms": 3, "floor": 6, "total_floors": 9, "area_sqm": 72, "price_amd": 480_000, "property_type": "apartment"},
    {"title": "Дом в Арабкире", "district": "Арабкир", "street": "ул. Айгедзор 5", "rooms": 4, "floor": 2, "total_floors": 2, "area_sqm": 180, "price_amd": 850_000, "property_type": "house"},
    {"title": "Офис в аренду", "district": "Кентрон", "street": "ул. Вардананц 10", "rooms": None, "floor": 3, "total_floors": 7, "area_sqm": 65, "price_amd": 600_000, "property_type": "commercial"},
    {"title": "1-комн. у метро", "district": "Аван", "street": "ул. Аван 3", "rooms": 1, "floor": 9, "total_floors": 14, "area_sqm": 38, "price_amd": 180_000, "property_type": "apartment"},
    {"title": "2-комн. с балконом", "district": "Нор Норк", "street": "ул. Гарегина Нжде 12", "rooms": 2, "floor": 5, "total_floors": 12, "area_sqm": 62, "price_amd": 290_000, "property_type": "apartment"},
    {"title": "Коттедж на выходные", "district": "Давташен", "street": "ул. Давташен 1-я 7", "rooms": 3, "floor": 1, "total_floors": 2, "area_sqm": 150, "price_amd": 750_000, "property_type": "house"},
]

COLORS = [
    (37, 99, 235), (16, 185, 129), (139, 92, 246), (245, 158, 11),
    (244, 63, 94), (6, 182, 212), (99, 102, 241), (234, 88, 12),
]

MINIMAL_JPEG = bytes([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xB5,
    0xFF, 0xD9,
])


def make_demo_jpeg(path: Path, r: int, g: int, b: int, label: str) -> None:
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (640, 480), (r, g, b))
        draw = ImageDraw.Draw(img)
        draw.text((24, 24), label[:40], fill=(255, 255, 255))
        img.save(path, "JPEG", quality=82)
    except ImportError:
        path.write_bytes(MINIMAL_JPEG)


def create_photos(listing_idx: int, title: str) -> list[str]:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    urls = []
    for i in range(2):
        name = f"demo_{listing_idx}_{i}.jpg"
        path = UPLOAD_DIR / name
        color = COLORS[(listing_idx + i) % len(COLORS)]
        make_demo_jpeg(path, *color, f"{title} #{i + 1}")
        urls.append(f"/uploads/{name}")
    return urls


async def insert_listing(conn, item: dict, deal_type: str, idx: int) -> None:
    prop_id = str(uuid.uuid4())
    listing_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    phone = f"37491000{idx:04d}"
    price_usd = max(1, item["price_amd"] // AMD_TO_USD)
    photos = create_photos(idx, item["title"])
    fp = f"demo_seed_{deal_type}_{idx}"
    desc = (
        f"{item['title']}. Демо-объявление SmartEstate. "
        f"Район: {item['district']}. Реальные фото, чистая карточка без дублей."
    )

    await conn.execute(
        """
            INSERT INTO properties (
                id, property_type, deal_type, district, street, rooms, floor,
                total_floors, area_sqm, current_price_usd, owner_price_usd,
                is_owner_verified, owner_phone, photo_urls, title, description_raw,
                fingerprint, status, duplicate_count, source_origin, moderation_status,
                contact_name, contact_phone, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $10,
                TRUE, $11, $12, $13, $14,
                $15, 'active', 0, 'native', 'approved',
                $16, $11, $17, $17
            )
        """,
        prop_id, item["property_type"], deal_type, item["district"], item["street"],
        item["rooms"], item["floor"], item["total_floors"], item["area_sqm"],
        price_usd, phone, photos, item["title"], desc, fp, "Демо продавец", now,
    )

    await conn.execute(
        """
            INSERT INTO listings (
                id, property_id, source_site, source_url, external_id,
                title, description, price_amd, price_usd, currency,
                poster_phone, poster_name, is_agency, rooms, floor,
                total_floors, area_sqm, district, address_raw, photo_urls,
                scraped_at, updated_at
            ) VALUES (
                $1, $2, 'smartestate', $3, $4,
                $5, $6, $7, $8, 'AMD',
                $9, $10, FALSE, $11, $12,
                $13, $14, $15, $16, $17,
                $18, $18
            )
        """,
        listing_id, prop_id, f"https://smartestate.am/listing/{prop_id}",
        f"demo-{deal_type}-{idx}", item["title"], desc, item["price_amd"],
        price_usd, phone, "Демо продавец", item["rooms"], item["floor"],
        item["total_floors"], item["area_sqm"], item["district"],
        item["street"], photos, now,
    )

    await conn.execute(
        """
            INSERT INTO price_history (id, property_id, price_usd, recorded_at, note, source_site)
            VALUES ($1, $2, $3, $4, 'Публикация', 'smartestate')
        """,
        str(uuid.uuid4()), prop_id, price_usd, now,
    )


async def main() -> None:
    dsn = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(
            "DELETE FROM price_history WHERE property_id IN (SELECT id FROM properties WHERE fingerprint LIKE 'demo_seed_%')"
        )
        await conn.execute("DELETE FROM listings WHERE external_id LIKE 'demo-%'")
        await conn.execute("DELETE FROM properties WHERE fingerprint LIKE 'demo_seed_%'")

        idx = 0
        for item in SALE_LISTINGS:
            await insert_listing(conn, item, "sale", idx)
            idx += 1
        for item in RENT_LISTINGS:
            await insert_listing(conn, item, "rent", idx)
            idx += 1
    finally:
        await conn.close()

    print(f"Seeded {idx} demo listings with 2 photos each.")


if __name__ == "__main__":
    asyncio.run(main())
