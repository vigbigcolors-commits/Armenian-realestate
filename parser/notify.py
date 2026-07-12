"""Публикация событий для Pro-уведомлений в Telegram."""
import json
import redis.asyncio as aioredis
from loguru import logger
from config import settings

CHANNEL = "new_owner_listing"


async def notify_new_owner_listing(data: dict) -> None:
    """Отправляет в Redis если объявление от собственника (не агентство)."""
    if data.get("is_agency"):
        return
    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        payload = json.dumps({
            "rooms": data.get("rooms"),
            "district": data.get("district"),
            "price_usd": data.get("price_usd"),
            "area_sqm": data.get("area_sqm"),
            "floor": data.get("floor"),
            "deal_type": data.get("deal_type"),
            "source_url": data.get("source_url"),
        })
        await r.publish(CHANNEL, payload)
        await r.aclose()
        logger.info(f"Pro-уведомление: {data.get('district')} ${data.get('price_usd')}")
    except Exception as e:
        logger.warning(f"Redis notify error: {e}")
