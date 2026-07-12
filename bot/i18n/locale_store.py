import os
import redis.asyncio as aioredis
from .content import Locale, DEFAULT_LOCALE

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
PREFIX = "bot_locale:"

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis


async def get_user_locale(telegram_id: int) -> Locale:
    r = await get_redis()
    val = await r.get(f"{PREFIX}{telegram_id}")
    if val in ("hy", "ru", "en"):
        return val  # type: ignore
    return DEFAULT_LOCALE


async def set_user_locale(telegram_id: int, locale: Locale) -> None:
    r = await get_redis()
    await r.set(f"{PREFIX}{telegram_id}", locale)
