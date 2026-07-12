"""
Фаза 4: фото → properties → AI-описания.
Запуск в контейнере: python scripts/run_phase4.py [--photos 80] [--descriptions 30]
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import select, or_, func, text

from ai import clean_property_description
from db import AsyncSessionFactory
from deduplicator import Deduplicator
from models import Listing, Property
from scraper import ListAmScraper, parse_listing_page


async def _fetch_listing_photos(scraper, listing, sem: asyncio.Semaphore) -> tuple[Listing, list[str] | None]:
    async with sem:
        await asyncio.sleep(4.0)
        for attempt in range(4):
            try:
                html = await scraper.fetch(listing.source_url)
                extra = listing.raw_data or {}
                deal_type = extra.get("deal_type", "sale")
                property_type = extra.get("property_type", "apartment")
                data = parse_listing_page(html, listing.source_url, deal_type, property_type)
                photos = data.get("photo_urls") or []
                return listing, photos if photos else None
            except Exception as e:
                err = str(e)
                if "429" in err and attempt < 3:
                    wait = 8 * (attempt + 1)
                    logger.warning(f"  429 {listing.external_id}, пауза {wait}s")
                    await asyncio.sleep(wait)
                    continue
                logger.warning(f"  ✗ {listing.source_url}: {e}")
                return listing, None
        return listing, None


async def resync_listing_photos(limit: int, concurrency: int = 4) -> int:
    updated = 0
    sem = asyncio.Semaphore(max(1, concurrency))
    async with ListAmScraper() as scraper:
        async with AsyncSessionFactory() as session:
            result = await session.execute(
                select(Listing)
                .where(Listing.is_active.is_(True))
                .where(
                    or_(
                        Listing.photo_urls.is_(None),
                        func.cardinality(Listing.photo_urls) == 0,
                    )
                )
                .order_by(Listing.scraped_at.desc())
                .limit(limit)
            )
            listings = result.scalars().all()
            logger.info(f"Resync photos: {len(listings)} listings (concurrency={concurrency})")

            tasks = [_fetch_listing_photos(scraper, listing, sem) for listing in listings]
            results = await asyncio.gather(*tasks)

            for listing, photos in results:
                if photos:
                    listing.photo_urls = photos
                    session.add(listing)
                    updated += 1
                    logger.info(f"  ✓ {listing.external_id}: {len(photos)} photos")

            await session.commit()
    return updated


async def resync_listing_metadata(limit: int) -> int:
    """Перепарсить поля объявления (комнаты, район, площадь) без фото."""
    updated = 0
    async with ListAmScraper() as scraper:
        async with AsyncSessionFactory() as session:
            result = await session.execute(
                select(Listing)
                .where(Listing.is_active.is_(True))
                .where(
                    or_(
                        Listing.rooms.is_(None),
                        Listing.district.is_(None),
                        Listing.district == "",
                    )
                )
                .order_by(Listing.scraped_at.desc())
                .limit(limit)
            )
            listings = result.scalars().all()
            logger.info(f"Resync metadata: {len(listings)} listings")

            for listing in listings:
                try:
                    html = await scraper.fetch(listing.source_url)
                    extra = listing.raw_data or {}
                    deal_type = extra.get("deal_type", "rent")
                    property_type = extra.get("property_type", "apartment")
                    data = parse_listing_page(html, listing.source_url, deal_type, property_type)
                    changed = False
                    for field in (
                        "rooms", "floor", "total_floors", "area_sqm",
                        "district", "address_raw", "title", "description",
                    ):
                        val = data.get(field)
                        if val is not None and getattr(listing, field) != val:
                            setattr(listing, field, val)
                            changed = True
                    if changed:
                        session.add(listing)
                        updated += 1
                except Exception as e:
                    logger.warning(f"  ✗ meta {listing.source_url}: {e}")

            await session.commit()
    return updated


async def reset_bad_dedup() -> None:
    """Сбросить ошибочную склейку (кроме seed-demo объектов)."""
    async with AsyncSessionFactory() as session:
        await session.execute(
            text("""
                UPDATE listings
                SET property_id = NULL, dedup_status = 'pending'
                WHERE property_id IS NOT NULL
                  AND property_id::text NOT LIKE 'a1000001%'
            """)
        )
        await session.execute(
            text("DELETE FROM price_history WHERE property_id::text NOT LIKE 'a1000001%'")
        )
        await session.execute(
            text("DELETE FROM properties WHERE id::text NOT LIKE 'a1000001%'")
        )
        await session.commit()
        logger.info("Dedup reset: non-seed properties cleared, listings back to pending")


async def promote_photos_to_properties() -> int:
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            text("""
                UPDATE properties p
                SET photo_urls = (sub.urls)[1:20]
                FROM (
                    SELECT l.property_id AS pid,
                           array_agg(DISTINCT u ORDER BY u) AS urls
                    FROM listings l
                    CROSS JOIN LATERAL unnest(l.photo_urls) AS u
                    WHERE l.property_id IS NOT NULL AND u IS NOT NULL
                    GROUP BY l.property_id
                ) sub
                WHERE p.id = sub.pid
                  AND sub.urls IS NOT NULL
                  AND cardinality(sub.urls) > 0
            """)
        )
        await session.commit()
        changed = result.rowcount or 0
        logger.info(f"Promoted photos on {changed} properties")
        return changed


async def backfill_descriptions(limit: int) -> int:
    done = 0
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(Property)
            .where(Property.description_clean.is_(None))
            .where(Property.description_raw.isnot(None))
            .limit(limit)
        )
        props = result.scalars().all()
        logger.info(f"Backfill descriptions: {len(props)} properties")

        for prop in props:
            cleaned = await clean_property_description(
                prop.description_raw,
                prop.title,
                prop.district,
                prop.rooms,
            )
            if cleaned:
                prop.description_clean = cleaned
                session.add(prop)
                done += 1
                logger.info(f"  ✓ {prop.id}")

        await session.commit()
    return done


async def run_dedup(batch_size: int = 200) -> int:
    async with AsyncSessionFactory() as session:
        dedup = Deduplicator(session)
        await dedup.process_pending_listings(batch_size=batch_size)
        result = await session.execute(
            select(func.count())
            .select_from(Listing)
            .where(Listing.dedup_status == "pending")
        )
        return int(result.scalar() or 0)


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--photos", type=int, default=60, help="Сколько listings перезагрузить")
    parser.add_argument("--photos-all", action="store_true", help="Перезагрузить фото у всех listings без фото")
    parser.add_argument("--photo-batch", type=int, default=100, help="Размер пачки для --photos-all")
    parser.add_argument("--photo-concurrency", type=int, default=1, help="Параллельных запросов при загрузке фото")
    parser.add_argument("--descriptions", type=int, default=30, help="Сколько описаний очистить")
    parser.add_argument("--skip-dedup", action="store_true")
    parser.add_argument("--metadata", type=int, default=0, help="Перепарсить метаданные listings")
    parser.add_argument("--reset-dedup", action="store_true", help="Сбросить ошибочную дедупликацию")
    parser.add_argument(
        "--dedup-batches",
        type=int,
        default=1,
        help="Сколько пачек dedup подряд (batch=200)",
    )
    args = parser.parse_args()

    logger.info("=== Phase 4 pipeline ===")
    if args.reset_dedup:
        await reset_bad_dedup()
    if args.metadata > 0:
        n_meta = await resync_listing_metadata(args.metadata)
        logger.info(f"Metadata updated: {n_meta}")

    if args.photos_all:
        total_photos = 0
        while True:
            n_batch = await resync_listing_photos(
                args.photo_batch,
                concurrency=args.photo_concurrency,
            )
            total_photos += n_batch
            promoted = await promote_photos_to_properties()
            logger.info(f"Batch photos={n_batch}, promoted_properties={promoted}")
            if n_batch == 0:
                break
        n_photos = total_photos
    else:
        n_photos = await resync_listing_photos(args.photos, concurrency=args.photo_concurrency)
    if not args.skip_dedup:
        pending = 1
        for i in range(args.dedup_batches):
            pending = await run_dedup()
            logger.info(f"Dedup batch {i + 1}/{args.dedup_batches}, pending left: {pending}")
            if pending == 0:
                break
    n_promoted = await promote_photos_to_properties()
    n_desc = await backfill_descriptions(args.descriptions)
    logger.info(
        f"Done: photos_updated={n_photos}, properties_with_photos={n_promoted}, descriptions={n_desc}"
    )


if __name__ == "__main__":
    asyncio.run(main())
