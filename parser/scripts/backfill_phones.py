"""
Фаза 4 — бэкфил номеров телефонов с list.am.

Для существующих объявлений без телефона достаёт реальный контакт продавца
через диалог /rtam, обновляет listings и продвигает owner_phone на properties.

Запуск в контейнере:
    python scripts/backfill_phones.py --limit 100
    python scripts/backfill_phones.py --all --batch 100
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import select, or_, text
from sqlalchemy.orm.attributes import flag_modified

from db import AsyncSessionFactory
from deduplicator import normalize_phone
from models import Listing
from scraper import ListAmScraper, is_agency_poster


async def _fetch_one(scraper, listing, sem: asyncio.Semaphore, delay: float):
    async with sem:
        await asyncio.sleep(delay)
        for attempt in range(4):
            try:
                info = await scraper.fetch_phone(listing.source_url)
                return listing, info
            except Exception as e:  # noqa: BLE001
                err = str(e)
                if "429" in err and attempt < 3:
                    wait = 8 * (attempt + 1)
                    logger.warning(f"  429 {listing.external_id}, пауза {wait}s")
                    await asyncio.sleep(wait)
                    continue
                logger.warning(f"  ✗ phone {listing.source_url}: {e}")
                return listing, None
        return listing, None


async def backfill_batch(limit: int, concurrency: int, delay: float) -> int:
    updated = 0
    sem = asyncio.Semaphore(max(1, concurrency))
    async with ListAmScraper() as scraper:
        async with AsyncSessionFactory() as session:
            result = await session.execute(
                select(Listing)
                .where(Listing.is_active.is_(True))
                .where(Listing.source_site == "list.am")
                .where(
                    or_(
                        Listing.poster_phone.is_(None),
                        Listing.poster_phone == "",
                    )
                )
                .order_by(Listing.scraped_at.desc())
                .limit(limit)
            )
            listings = result.scalars().all()
            if not listings:
                return 0
            logger.info(f"Backfill phones: {len(listings)} listings (conc={concurrency})")

            tasks = [_fetch_one(scraper, l, sem, delay) for l in listings]
            results = await asyncio.gather(*tasks)

            for listing, info in results:
                if not info or not info.get("phone"):
                    continue
                phone = normalize_phone(info["phone"]) or info["phone"]
                listing.poster_phone = phone
                if info.get("poster_name"):
                    listing.poster_name = info["poster_name"]
                    listing.is_agency = is_agency_poster(info["poster_name"], listing.description or "")
                if info.get("poster_user_id"):
                    listing.raw_data = {
                        **(listing.raw_data or {}),
                        "poster_user_id": info["poster_user_id"],
                    }
                    flag_modified(listing, "raw_data")
                session.add(listing)
                updated += 1
                logger.info(f"  ✓ {listing.external_id}: {phone} ({'agency' if listing.is_agency else 'owner'})")

            await session.commit()
    return updated


async def promote_phones_to_properties() -> int:
    """
    Продвигает лучший телефон на properties.owner_phone.
    Приоритет — собственник (is_agency=false), затем минимальная цена.
    """
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            text("""
                UPDATE properties p
                SET owner_phone = sub.poster_phone,
                    is_owner_verified = CASE WHEN sub.is_agency THEN p.is_owner_verified ELSE TRUE END
                FROM (
                    SELECT DISTINCT ON (l.property_id)
                           l.property_id AS pid,
                           l.poster_phone,
                           l.is_agency
                    FROM listings l
                    WHERE l.property_id IS NOT NULL
                      AND l.poster_phone IS NOT NULL
                      AND l.poster_phone != ''
                    ORDER BY l.property_id,
                             (l.is_agency IS TRUE),
                             l.price_usd ASC NULLS LAST
                ) sub
                WHERE p.id = sub.pid
                  AND (p.owner_phone IS NULL OR p.owner_phone = '')
            """)
        )
        await session.commit()
        changed = result.rowcount or 0
        logger.info(f"Promoted phones to {changed} properties")
        return changed


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100, help="Сколько объявлений обработать")
    ap.add_argument("--all", action="store_true", help="Обрабатывать пачками до конца")
    ap.add_argument("--batch", type=int, default=100, help="Размер пачки для --all")
    ap.add_argument("--concurrency", type=int, default=2, help="Параллельных запросов")
    ap.add_argument("--delay", type=float, default=3.0, help="Задержка перед каждым запросом, сек")
    args = ap.parse_args()

    logger.info("=== Phase 4: backfill phones ===")
    total = 0
    if args.all:
        while True:
            n = await backfill_batch(args.batch, args.concurrency, args.delay)
            total += n
            logger.info(f"Batch done: +{n} (total {total})")
            if n == 0:
                break
    else:
        total = await backfill_batch(args.limit, args.concurrency, args.delay)

    promoted = await promote_phones_to_properties()
    logger.info(f"Done: phones_updated={total}, properties_promoted={promoted}")


if __name__ == "__main__":
    asyncio.run(main())
