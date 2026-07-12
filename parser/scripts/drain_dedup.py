"""Промотать все pending-объявления в properties и нормализовать локации.

Одноразовый помощник: гоняет дедуп батчами, пока не кончатся pending,
затем продвигает фото и бэкфилл районов. Безопасно запускать рядом со сбором.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import text

from db import AsyncSessionFactory
from deduplicator import Deduplicator


async def go() -> None:
    for i in range(40):
        async with AsyncSessionFactory() as s:
            r = await s.execute(
                text("SELECT count(*) FROM listings WHERE dedup_status = 'pending'")
            )
            pending = int(r.scalar() or 0)
            logger.info(f"iter {i}: pending={pending}")
            if pending == 0:
                break
            d = Deduplicator(s)
            await d.process_pending_listings(batch_size=500)

    try:
        from scripts.run_phase4 import promote_photos_to_properties
        await promote_photos_to_properties()
    except Exception as e:  # noqa: BLE001
        logger.warning(f"promote err: {e}")
    try:
        from scripts.backfill_locations import backfill_listings, backfill_properties
        await backfill_listings()
        await backfill_properties()
    except Exception as e:  # noqa: BLE001
        logger.warning(f"backfill err: {e}")
    logger.info("ALL DONE")


if __name__ == "__main__":
    asyncio.run(go())
