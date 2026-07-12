"""Определение типа сделки: продажа vs аренда."""
from __future__ import annotations

import re
from typing import Optional

# Аренда в Ереване: ~$150–$4 000/мес. Продажа: от ~$25 000.
SALE_MIN_USD = 12_000
RENT_MAX_USD = 15_000

RENT_MARKERS = re.compile(
    r"վարձ|аренд|сда[её]тся|сним|rent|per\s*month|/мес|/ամիս|monthly",
    re.I,
)
SALE_MARKERS = re.compile(
    r"վաճառ|продаж|купить|sale|for\s*sale|գնում|ի\s*վաճառք",
    re.I,
)


def infer_deal_type(
    price_usd: Optional[int],
    raw_deal_type: str = "sale",
    title: str = "",
    description: str = "",
) -> str:
    """Возвращает 'rent' или 'sale' с учётом цены и текста объявления."""
    text = f"{title or ''} {description or ''}"

    if price_usd is not None and price_usd > 0:
        if price_usd < RENT_MAX_USD and price_usd < SALE_MIN_USD:
            return "rent"
        if price_usd >= SALE_MIN_USD:
            return "sale"

    if RENT_MARKERS.search(text):
        return "rent"
    if SALE_MARKERS.search(text):
        return "sale"

    if raw_deal_type in ("rent", "sale"):
        return raw_deal_type
    return "sale"


def sale_price_floor_usd() -> int:
    return SALE_MIN_USD


def rent_price_ceiling_usd() -> int:
    return RENT_MAX_USD
