"""Одноразовое исправление deal_type по цене и тексту."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger
from sqlalchemy import select

from db import AsyncSessionFactory
from deal_type_utils import infer_deal_type
from models import Property, Listing


async def fix_properties() -> None:
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(Property).where(Property.status == "active")
        )
        props = result.scalars().all()
        changed = 0
        for prop in props:
            listing_result = await session.execute(
                select(Listing)
                .where(Listing.property_id == prop.id)
                .order_by(Listing.scraped_at.desc())
                .limit(1)
            )
            listing = listing_result.scalars().first()
            raw = (listing.raw_data if listing else {}) or {}
            resolved = infer_deal_type(
                prop.current_price_usd,
                raw.get("deal_type", prop.deal_type),
                prop.title or (listing.title if listing else "") or "",
                prop.description_raw or (listing.description if listing else "") or "",
            )
            if resolved != prop.deal_type:
                prop.deal_type = resolved
                session.add(prop)
                changed += 1
        await session.commit()
        logger.info(f"Properties deal_type fixed: {changed}/{len(props)}")


if __name__ == "__main__":
    asyncio.run(fix_properties())
