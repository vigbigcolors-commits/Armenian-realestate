"""
Бэкфил локаций по всей Армении.

Старый extract_district знал только Ереван, поэтому у региональных
объявлений district = NULL. Перепрогоняем распознавание по тексту
(адрес + заголовок + описание) и проставляем каноничные имена
в listings.district, затем продвигаем в properties.district.

Запуск: python scripts/backfill_locations.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import select, text

from db import AsyncSessionFactory
from models import Listing, Property
from scraper import extract_district


async def backfill_listings() -> int:
    updated = 0
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(Listing))
        listings = result.scalars().all()
        logger.info(f"Listings to scan: {len(listings)}")

        for lst in listings:
            haystack = " ".join(filter(None, [
                lst.address_raw, lst.title, lst.district, lst.description,
            ]))
            canon = extract_district(haystack)
            if canon and canon != lst.district:
                lst.district = canon
                session.add(lst)
                updated += 1

        await session.commit()
    logger.info(f"Listings updated: {updated}")
    return updated


async def backfill_properties() -> int:
    """district на properties из лучшего listing, иначе из собственного текста."""
    async with AsyncSessionFactory() as session:
        # 1) из привязанных listings
        res = await session.execute(
            text("""
                UPDATE properties p
                SET district = sub.district
                FROM (
                    SELECT DISTINCT ON (l.property_id)
                           l.property_id AS pid, l.district
                    FROM listings l
                    WHERE l.property_id IS NOT NULL AND l.district IS NOT NULL
                    ORDER BY l.property_id, l.scraped_at DESC
                ) sub
                WHERE p.id = sub.pid
                  AND (p.district IS NULL OR p.district = '')
            """)
        )
        from_listings = res.rowcount or 0
        await session.commit()

        # 2) нормализуем ВСЕ properties к каноничному имени (Կենտրոն → Центр)
        #    и добираем district по собственному тексту, где пусто.
        result = await session.execute(select(Property))
        props = result.scalars().all()
        normalized = 0
        for p in props:
            haystack = " ".join(filter(None, [p.district, p.street, p.title, p.description_raw]))
            canon = extract_district(haystack)
            if canon and canon != p.district:
                p.district = canon
                session.add(p)
                normalized += 1
        await session.commit()

    logger.info(f"Properties updated: from_listings={from_listings}, normalized={normalized}")
    return from_listings + normalized


async def report() -> None:
    async with AsyncSessionFactory() as session:
        rows = await session.execute(
            text("""
                SELECT COALESCE(district, '—') AS d, COUNT(*) AS n
                FROM properties WHERE status = 'active'
                GROUP BY district ORDER BY n DESC LIMIT 25
            """)
        )
        logger.info("Top districts on active properties:")
        for r in rows.mappings().all():
            logger.info(f"  {r['d']}: {r['n']}")


async def main() -> None:
    logger.info("=== Backfill locations (all Armenia) ===")
    await backfill_listings()
    await backfill_properties()
    await report()


if __name__ == "__main__":
    asyncio.run(main())
