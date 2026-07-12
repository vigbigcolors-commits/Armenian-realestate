"""
Сбор объявлений по всем регионам Армении (кроме Еревана).

Использует ?n=<id_региона> на list.am, категории:
  63 = аренда (все типы), 62 = продажа (все типы).
После сбора запускает дедупликацию и продвижение фото/локаций.

Запуск: python scripts/scrape_regions.py [--pages 8]
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import text

from config import REGION_TARGETS, settings
from db import AsyncSessionFactory
from deduplicator import Deduplicator
from scraper import ListAmScraper


async def _save(data: dict) -> None:
    from main import save_listing
    async with AsyncSessionFactory() as session:
        try:
            await save_listing(data, session)
            await session.commit()
        except Exception as e:  # noqa: BLE001
            await session.rollback()
            logger.warning(f"save {data.get('source_url')}: {e}")


async def _is_known(url: str) -> bool:
    from sqlalchemy import select, exists
    from models import Listing
    async with AsyncSessionFactory() as session:
        return bool(await session.scalar(select(exists().where(Listing.source_url == url))))


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=8, help="Макс страниц на регион/категорию")
    args = ap.parse_args()

    logger.info(f"=== Scrape regions: {len(REGION_TARGETS)} targets, {args.pages} pages each ===")
    total = 0
    delta = settings.parser_delta_mode
    async with ListAmScraper() as scraper:
        for target in REGION_TARGETS:
            try:
                found = await scraper.scrape_category(
                    target,
                    max_pages=args.pages,
                    on_listing_found=_save,
                    known_check=_is_known if delta else None,
                    stop_after_known=settings.parser_delta_stop_known if delta else None,
                )
                total += len(found)
                logger.info(f"[{target['name']}] собрано {len(found)} (итого {total})")
            except Exception as e:  # noqa: BLE001
                logger.error(f"[{target['name']}] ошибка: {e}")

    logger.info("Дедупликация…")
    async with AsyncSessionFactory() as session:
        dedup = Deduplicator(session)
        await dedup.process_pending_listings(batch_size=300)

    # Продвигаем фото и нормализуем локации
    try:
        from scripts.run_phase4 import promote_photos_to_properties
        await promote_photos_to_properties()
    except Exception as e:  # noqa: BLE001
        logger.warning(f"promote photos: {e}")
    try:
        from scripts.backfill_locations import backfill_listings, backfill_properties
        await backfill_listings()
        await backfill_properties()
    except Exception as e:  # noqa: BLE001
        logger.warning(f"backfill locations: {e}")

    async with AsyncSessionFactory() as session:
        rows = await session.execute(text("""
            SELECT district, deal_type, COUNT(*) n
            FROM properties WHERE status='active'
            GROUP BY district, deal_type
            ORDER BY n DESC LIMIT 30
        """))
        logger.info("Districts after region scrape:")
        for r in rows.mappings().all():
            logger.info(f"  {r['district']} / {r['deal_type']}: {r['n']}")

    logger.info(f"Done. Total listings collected: {total}")


if __name__ == "__main__":
    asyncio.run(main())
