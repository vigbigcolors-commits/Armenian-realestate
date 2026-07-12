"""
Продолжение Фазы 4: дедуп → promote → фото → аренда.
  python scripts/phase4_continue.py [--dedup-only] [--photos-only] [--rent]
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import func, select, text

from db import AsyncSessionFactory
from deduplicator import Deduplicator
from models import Listing
from main import save_listing
from scraper import ListAmScraper
from config import LISTAM_TARGETS
from scripts.run_phase4 import (
    promote_photos_to_properties,
    resync_listing_photos,
)


async def run_dedup_loop(batches: int, batch_size: int = 200) -> int:
    pending = 0
    for i in range(batches):
        async with AsyncSessionFactory() as session:
            dedup = Deduplicator(session)
            await dedup.process_pending_listings(batch_size=batch_size)
            result = await session.execute(
                select(func.count()).select_from(Listing).where(Listing.dedup_status == "pending")
            )
            pending = int(result.scalar() or 0)
        promoted = await promote_photos_to_properties()
        logger.info(f"Dedup batch {i + 1}/{batches}: pending={pending}, promoted={promoted}")
        if pending == 0:
            break
    return pending


async def photos_loop(batch_size: int, max_batches: int) -> int:
    total = 0
    for i in range(max_batches):
        n = await resync_listing_photos(batch_size, concurrency=1)
        promoted = await promote_photos_to_properties()
        total += n
        logger.info(f"Photos batch {i + 1}: fetched={n}, total={total}, promoted={promoted}")
        if n == 0:
            break
        await asyncio.sleep(5)
    return total


async def scrape_rent(pages: int) -> None:
    target = next(t for t in LISTAM_TARGETS if t["name"] == "list_am_apartments_rent")

    async with ListAmScraper() as scraper:
        async def on_found(data):
            async with AsyncSessionFactory() as session:
                await save_listing(data, session)
                await session.commit()

        await scraper.scrape_category(target, max_pages=pages, on_listing_found=on_found)

    await run_dedup_loop(batches=10)
    await promote_photos_to_properties()


async def print_stats() -> None:
    async with AsyncSessionFactory() as session:
        r = await session.execute(text("""
            SELECT
              (SELECT COUNT(*) FROM listings WHERE is_active
                 AND photo_urls IS NOT NULL AND cardinality(photo_urls)>0) AS listings_photos,
              (SELECT COUNT(*) FROM listings WHERE is_active
                 AND photo_urls IS NOT NULL AND cardinality(photo_urls)>0
                 AND property_id IS NULL) AS photos_unlinked,
              (SELECT COUNT(*) FROM properties WHERE status='active'
                 AND photo_urls IS NOT NULL AND cardinality(photo_urls)>0) AS props_photos,
              (SELECT COUNT(*) FROM properties WHERE status='active' AND deal_type='rent') AS rent_props
        """))
        row = r.mappings().first()
        logger.info(f"STATS: {dict(row)}")


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dedup-only", action="store_true")
    ap.add_argument("--photos-only", action="store_true")
    ap.add_argument("--rent", action="store_true")
    ap.add_argument("--dedup-batches", type=int, default=25)
    ap.add_argument("--photo-batches", type=int, default=50)
    ap.add_argument("--photo-batch-size", type=int, default=60)
    ap.add_argument("--rent-pages", type=int, default=3)
    args = ap.parse_args()

    await print_stats()

    if args.dedup_only or (not args.photos_only and not args.rent):
        await run_dedup_loop(args.dedup_batches)
        await print_stats()

    if args.photos_only or (not args.dedup_only and not args.rent):
        await photos_loop(args.photo_batch_size, args.photo_batches)
        await print_stats()

    if args.rent:
        logger.info("Scraping rent...")
        await scrape_rent(args.rent_pages)
        await print_stats()

    logger.info("Phase 4 continue done")


if __name__ == "__main__":
    asyncio.run(main())
