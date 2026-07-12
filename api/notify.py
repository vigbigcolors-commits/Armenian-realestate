"""Redis pub/sub — мгновенные Pro-уведомления риелторам."""
import json
import os

import redis.asyncio as aioredis
from loguru import logger

CHANNEL = "new_owner_listing"
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")


async def notify_new_owner_listing(data: dict) -> None:
    """Публикует событие, если объявление от собственника (не агентство)."""
    if data.get("is_agency"):
        return
    try:
        r = aioredis.from_url(REDIS_URL, decode_responses=True)
        payload = json.dumps(data, ensure_ascii=False)
        await r.publish(CHANNEL, payload)
        await r.aclose()
        logger.info(
            "Pro alert queued: {pid} {district} ${price}",
            pid=data.get("property_id"),
            district=data.get("district"),
            price=data.get("price_usd"),
        )
    except Exception as e:
        logger.warning(f"Redis notify error: {e}")
