"""Удалить чужие фото (/r/) из listings и properties."""

import asyncio

import sys

from pathlib import Path



sys.path.insert(0, str(Path(__file__).resolve().parents[1]))



from loguru import logger

from sqlalchemy import select, text



from db import AsyncSessionFactory

from models import Listing, Property

from photos import filter_listing_photos





async def fix_table(session, model, label: str) -> int:

    result = await session.execute(select(model))

    rows = result.scalars().all()

    changed = 0

    for row in rows:

        before = list(row.photo_urls or [])

        after = filter_listing_photos(before)

        if after != before:

            row.photo_urls = after or None

            session.add(row)

            changed += 1

    await session.commit()

    logger.info(f"{label}: cleaned {changed}/{len(rows)} rows")

    return changed





async def main() -> None:

    async with AsyncSessionFactory() as session:

        lc = await fix_table(session, Listing, "listings")

        pc = await fix_table(session, Property, "properties")



    async with AsyncSessionFactory() as session:

        await session.execute(text("""

            UPDATE properties p

            SET photo_urls = l.photo_urls

            FROM listings l

            WHERE l.property_id = p.id

              AND l.dedup_status = 'original'

              AND l.photo_urls IS NOT NULL

              AND cardinality(l.photo_urls) > 0

        """))

        await session.commit()

        logger.info("Synced property photos from original listings")



    logger.info(f"Done: listings={lc}, properties={pc}")





if __name__ == "__main__":

    asyncio.run(main())


