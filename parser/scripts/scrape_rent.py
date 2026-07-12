"""
Быстрый прогон одной категории + дедуп + фото.
  python scripts/scrape_rent.py [--pages 5] [--dedup]
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger

from config import LISTAM_TARGETS
from db import AsyncSessionFactory
from deduplicator import Deduplicator
from main import save_listing
from scraper import ListAmScraper
from scripts.run_phase4 import promote_photos_to_properties, resync_listing_photos


async def scrape_target(name: str, max_pages: int) -> int:
    target = next((t for t in LISTAM_TARGETS if t["name"] == name), None)
    if not target:
        raise SystemExit(f"Unknown target: {name}")

    saved = 0

    async with ListAmScraper() as scraper:
        async def on_found(data):
            nonlocal saved
            async with AsyncSessionFactory() as session:
                is_new = await save_listing(data, session)
                await session.commit()
                if is_new:
                    saved += 1

        await scraper.scrape_category(target, max_pages=max_pages, on_listing_found=on_found)

    logger.info(f"[{name}] saved/updated run complete, new listings: {saved}")
    return saved


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages", type=int, default=5)
    parser.add_argument("--dedup", action="store_true")
    parser.add_argument("--photos", type=int, default=120)
    parser.add_argument("--target", default="list_am_apartments_rent")
    args = parser.parse_args()

    await scrape_target(args.target, args.pages)

    if args.dedup:
        async with AsyncSessionFactory() as session:
            dedup = Deduplicator(session)
            await dedup.process_pending_listings(batch_size=300)
            logger.info("Dedup done")

    if args.photos:
        n = await resync_listing_photos(args.photos)
        logger.info(f"Photo resync: {n} listings")
        promoted = await promote_photos_to_properties()
        logger.info(f"Promoted photos: {promoted} properties")


if __name__ == "__main__":
    asyncio.run(main())
