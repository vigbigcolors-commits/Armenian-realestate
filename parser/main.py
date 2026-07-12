"""
Точка входа парсера.
Запускает парсинг по расписанию + дедупликацию после каждого прогона.
"""
import asyncio
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger

from config import settings, LISTAM_TARGETS
from db import AsyncSessionFactory
from models import Listing, ScrapeLog
from scraper import ListAmScraper
from deduplicator import Deduplicator
from notify import notify_new_owner_listing


# ─── Сохранение одного объявления в БД ───────────────────────
_LISTING_REFRESH_FIELDS = (
    "title", "description", "price_amd", "price_usd", "currency",
    "poster_phone", "poster_name", "is_agency", "rooms", "floor",
    "total_floors", "area_sqm", "district", "address_raw", "photo_urls",
    "external_id", "is_active",
)


async def save_listing(data: dict, session) -> bool:
    """Возвращает True если запись новая. Существующие объявления обновляются."""
    from datetime import datetime, timezone
    from sqlalchemy import select
    from photos import has_real_photo, filter_listing_photos

    # Ingest guard: объявления без реального фото (/f/) в базу не пускаем.
    if settings.parser_require_photo and not has_real_photo(data.get("photo_urls")):
        return False
    # Храним только чистые фото галереи
    if data.get("photo_urls"):
        data["photo_urls"] = filter_listing_photos(data["photo_urls"])

    existing = await session.execute(
        select(Listing).where(Listing.source_url == data["source_url"])
    )
    row = existing.scalars().first()

    allowed = {c.key for c in Listing.__table__.columns}
    extra = {
        k: data[k]
        for k in ("deal_type", "property_type", "poster_user_id")
        if k in data and data[k] is not None
    }
    clean = {k: v for k, v in data.items() if k in allowed}
    clean["raw_data"] = {**(clean.get("raw_data") or {}), **extra}

    if row:
        for field in _LISTING_REFRESH_FIELDS:
            val = clean.get(field)
            if val is not None and getattr(row, field) != val:
                setattr(row, field, val)
        row.raw_data = {**(row.raw_data or {}), **extra}
        row.scraped_at = datetime.now(timezone.utc)
        row.is_active = True
        session.add(row)
        return False

    listing = Listing(**clean)
    session.add(listing)
    return True


# ─── Один полный прогон ───────────────────────────────────────
async def run_full_scrape():
    logger.info("=" * 60)
    logger.info(f"Запуск парсинга: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    async with AsyncSessionFactory() as session:
        log = ScrapeLog(source_site="list.am", status="running")
        session.add(log)
        await session.commit()

        total_new = 0
        errors = []

        # Delta-режим: знаем ли мы уже это объявление (по source_url)
        async def is_known(url: str) -> bool:
            from sqlalchemy import select, exists
            async with AsyncSessionFactory() as s:
                found = await s.scalar(
                    select(exists().where(Listing.source_url == url))
                )
                return bool(found)

        delta = settings.parser_delta_mode
        scrape_kwargs = {}
        if delta:
            scrape_kwargs = {
                "max_pages": settings.parser_delta_max_pages,
                "known_check": is_known,
                "stop_after_known": settings.parser_delta_stop_known,
            }
            logger.info(
                f"Delta-режим: до {settings.parser_delta_max_pages} стр., "
                f"стоп после {settings.parser_delta_stop_known} известных."
            )

        async with ListAmScraper() as scraper:
            for target in LISTAM_TARGETS:
                try:
                    async def on_found(data):
                        nonlocal total_new
                        async with AsyncSessionFactory() as s:
                            is_new = await save_listing(data, s)
                            if is_new:
                                total_new += 1
                                await s.commit()
                                if not data.get("is_agency"):
                                    await notify_new_owner_listing(data)

                    await scraper.scrape_category(
                        target, on_listing_found=on_found, **scrape_kwargs,
                    )

                except Exception as e:
                    msg = f"[{target['name']}] Критическая ошибка: {e}"
                    logger.error(msg)
                    errors.append(msg)

        logger.info(f"Парсинг завершен. Новых объявлений: {total_new}")

        # Подтянуть фото на properties после прогона
        try:
            from scripts.run_phase4 import promote_photos_to_properties
            promoted = await promote_photos_to_properties()
            logger.info(f"Фото на properties обновлены: {promoted}")
        except Exception as e:
            logger.warning(f"promote_photos_to_properties: {e}")

        # Запускаем санитара
        logger.info("Запускаем алгоритм-санитар (дедупликация)...")
        async with AsyncSessionFactory() as dedup_session:
            deduplicator = Deduplicator(dedup_session)
            await deduplicator.process_pending_listings(batch_size=200)
            logger.info("Дедупликация завершена.")

        # Обновляем лог
        from sqlalchemy import update
        async with AsyncSessionFactory() as s:
            await s.execute(
                update(ScrapeLog)
                .where(ScrapeLog.id == log.id)
                .values(
                    finished_at=datetime.utcnow(),
                    new_listings=total_new,
                    status="error" if errors else "success",
                    errors=errors or None,
                )
            )
            await s.commit()


# ─── Точка входа ─────────────────────────────────────────────
async def main():
    logger.add("logs/parser_{time}.log", rotation="1 day", retention="7 days")
    logger.info("SmartEstate Armenia — Парсер запущен")

    # Первый прогон сразу при старте
    await run_full_scrape()

    # Планировщик: повторять каждые N минут
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_full_scrape,
        "interval",
        minutes=settings.parser_interval_minutes,
        id="scrape_job",
    )
    scheduler.start()
    logger.info(f"Следующий прогон через {settings.parser_interval_minutes} минут")

    # Держим процесс живым
    try:
        while True:
            await asyncio.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Парсер остановлен.")
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
