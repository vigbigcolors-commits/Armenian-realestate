"""
Очистка и обогащение текста объявлений через Gemini (с fallback).
"""
import asyncio
import json
import re
from typing import Optional

from loguru import logger

from config import settings


def _fix_merged_words(text: str) -> str:
    if not text:
        return ""
    t = text
    t = re.sub(r"([а-яёa-z0-9])([А-ЯЁA-Z])", r"\1 \2", t)
    t = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", t)
    t = re.sub(r"([ա-ֆ])([Ա-Ֆ])", r"\1 \2", t)
    t = re.sub(r"([.!?։])([А-ЯЁA-ZԱ-Ֆ])", r"\1 \2", t)
    t = re.sub(r"услуги\s*удобств", "услуги и удобств", t, flags=re.I)
    t = re.sub(r"аренда\s*депозит", "аренда, депозит", t, flags=re.I)
    t = re.sub(r"месяц\s*Звоните", "месяц. Звоните", t, flags=re.I)
    t = re.sub(r"rent\s*The", "rent. The", t, flags=re.I)
    t = re.sub(r"month\s*Call", "month. Call", t, flags=re.I)
    return t


def _strip_noise(text: str) -> str:
    if not text:
        return ""
    t = re.sub(r"https?://\S+", "", text)
    t = re.sub(r"\+?\d[\d\s\-()]{7,}\d", "", t)
    t = re.sub(r"[!]{2,}", "!", t)
    t = _fix_merged_words(t)
    t = re.sub(r"\s*\*\s*", "\n• ", t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    if t.isupper() and len(t) > 20:
        t = t[:1].upper() + t[1:].lower()
    return t


def fallback_clean(description: str, title: str = "", district: str = "", rooms: int | None = None) -> dict:
    """Простая очистка без AI."""
    base = _strip_noise(description or title)
    if not base:
        base = title or ""
    district_part = f", {district}" if district else ""
    rooms_part = f"{rooms}-room" if rooms else "property"
    en = base or f"Well-maintained {rooms_part} in Yerevan{district_part}."
    ru = base or f"Ухоженная квартира в Ереване{district_part}."
    hy = base or f"Լավ վիճակի բնակարան Երևանում{district_part}."
    return {"hy": hy, "ru": ru, "en": en}


def _gemini_clean_sync(description: str, title: str, district: str, rooms: int | None) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    prompt = f"""You are a premium real estate editor for Yerevan, Armenia.
Rewrite this messy listing into flawless, professional copy in THREE languages.

RULES:
- Remove phone numbers, URLs, CAPS spam, emojis, urgency tricks ("срочно!!!")
- Fix grammar; keep factual details (rooms, district, condition, amenities)
- Tone: calm, trustworthy, premium — like a top agency editor
- 2-3 short paragraphs max per language
- Return ONLY valid JSON: {{"hy":"...","ru":"...","en":"..."}}

TITLE: {title or "—"}
DISTRICT: {district or "—"}
ROOMS: {rooms or "—"}
RAW TEXT:
{description or title or "—"}
"""
    response = model.generate_content(prompt)
    raw = response.text.strip()
    raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE)
    data = json.loads(raw)
    return {
        "hy": _strip_noise(data.get("hy", "")),
        "ru": _strip_noise(data.get("ru", "")),
        "en": _strip_noise(data.get("en", "")),
    }


async def clean_property_description(
    description: Optional[str],
    title: Optional[str] = None,
    district: Optional[str] = None,
    rooms: Optional[int] = None,
) -> dict:
    """Возвращает description_clean: hy, ru, en."""
    raw = description or title
    if not raw:
        return {}

    if settings.gemini_api_key and settings.ai_provider == "gemini":
        try:
            result = await asyncio.to_thread(
                _gemini_clean_sync,
                description or "",
                title or "",
                district or "",
                rooms,
            )
            if any(result.values()):
                return result
        except Exception as e:
            logger.warning(f"Gemini clean failed, using fallback: {e}")

    return fallback_clean(description or "", title or "", district or "", rooms)
