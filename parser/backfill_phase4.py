"""
Одноразовый backfill: description_clean для существующих properties.
Запуск: python backfill_phase4.py
"""
import asyncio

from loguru import logger
from sqlalchemy import select, text

from db import AsyncSessionFactory
from models import Property
from ai import clean_property_description


async def run():
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(Property).where(
                Property.description_clean.is_(None),
                Property.description_raw.isnot(None),
            ).limit(100)
        )
        props = result.scalars().all()
        logger.info(f"Backfill: {len(props)} properties")

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
                logger.info(f"  ✓ {prop.id}")

        await session.commit()
    logger.info("Backfill done")


if __name__ == "__main__":
    asyncio.run(run())
