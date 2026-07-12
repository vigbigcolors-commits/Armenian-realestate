"""
Алгоритм-Санитар — Цех 2 «Очистка»

Принцип работы:
1. Берем новое объявление из listings (dedup_status='pending')
2. Сравниваем с уже известными объявлениями по набору сигналов
3. Если сигналы совпадают — это дубликат одного объекта
4. Склеиваем дубликаты в одну карточку в таблице properties
5. Записываем историю цен в price_history

Сигналы для склейки (в порядке надежности):
  A. Одинаковый хэш первого фото (perceptual hash, pHash)  ← самый сильный
  B. Одинаковый телефон + район + комнаты + этаж
  C. Текстовое сходство описания > 85%
"""
import hashlib
import io
import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from imagehash import phash
from PIL import Image
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from models import Listing, Property, PriceHistory
from ai import fallback_clean
from deal_type_utils import infer_deal_type
from photos import filter_listing_photos


# ─── Перцептивный хэш изображения ────────────────────────────
async def compute_photo_hash(photo_url: str) -> Optional[str]:
    """
    Скачивает первое фото и считает pHash.
    pHash устойчив к изменению размера, водяным знакам и сжатию.
    Два разных скриншота одного дивана дадут ОДИНАКОВЫЙ хэш.
    """
    if not photo_url:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(photo_url)
            resp.raise_for_status()
            img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            return str(phash(img))
    except Exception as e:
        logger.warning(f"Не удалось вычислить хэш фото {photo_url}: {e}")
        return None


# ─── Нормализация телефона ────────────────────────────────────
def normalize_phone(phone: str) -> Optional[str]:
    if not phone:
        return None
    digits = re.sub(r"[^\d]", "", phone)
    if digits.startswith("374"):
        return digits
    if digits.startswith("0"):
        return "374" + digits[1:]
    if len(digits) == 8:
        return "374" + digits
    return digits if len(digits) >= 8 else None


# ─── Текстовое сходство (простое без ML) ─────────────────────
def text_similarity(text1: str, text2: str) -> float:
    """Коэффициент Жаккара по биграммам."""
    if not text1 or not text2:
        return 0.0

    def bigrams(s):
        s = re.sub(r"\s+", " ", s.lower().strip())
        return {s[i:i+2] for i in range(len(s) - 1)}

    b1, b2 = bigrams(text1), bigrams(text2)
    if not b1 or not b2:
        return 0.0
    return len(b1 & b2) / len(b1 | b2)


# ─── Генерация fingerprint объекта недвижимости ───────────────
def make_property_fingerprint(
    district: str,
    rooms: int,
    floor: int,
    area_sqm: float,
    building_number: str,
) -> str:
    """
    Уникальный хэш физического объекта.
    Одинаковые квартиры получат одинаковый fingerprint.
    """
    raw = "|".join([
        str(district or "").lower().strip(),
        str(rooms or ""),
        str(floor or ""),
        str(round(area_sqm or 0, 0)),
        str(building_number or "").lower().strip(),
    ])
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


# ─── Основная логика дедупликации ────────────────────────────
class Deduplicator:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def process_pending_listings(self, batch_size: int = 50):
        """Обрабатывает необработанные объявления пачками."""
        result = await self.session.execute(
            select(Listing)
            .where(Listing.dedup_status == "pending")
            .limit(batch_size)
        )
        listings = result.scalars().all()
        logger.info(f"Санитар: обрабатываем {len(listings)} объявлений")

        for listing in listings:
            try:
                await self.process_one(listing)
            except Exception as e:
                await self.session.rollback()
                logger.error(f"Ошибка при обработке listing {listing.external_id}: {e}")

        await self.session.commit()

    async def process_one(self, listing: Listing):
        """
        Для одного объявления:
        1. Ищем дубликат среди уже обработанных
        2. Если нашли — привязываем к существующему property
        3. Если не нашли — создаем новый property
        4. Пишем в price_history
        """
        if listing.poster_phone:
            listing.poster_phone = normalize_phone(listing.poster_phone) or listing.poster_phone

        # Вычисляем хэш первого фото
        if listing.photo_urls and not listing.photo_hash:
            listing.photo_hash = await compute_photo_hash(listing.photo_urls[0])
            self.session.add(listing)

        # Ищем совпадение
        matched_property = await self._find_matching_property(listing)

        if matched_property:
            # Это дубликат
            listing.property_id = matched_property.id
            listing.dedup_status = "duplicate"
            matched_property.duplicate_count = (matched_property.duplicate_count or 0) + 1

            if not listing.is_agency:
                matched_property.owner_price_usd = listing.price_usd
                matched_property.is_owner_verified = True
                if listing.poster_phone:
                    matched_property.owner_phone = listing.poster_phone

            # Обновляем цену если это минимальная
            if listing.price_usd and (
                not matched_property.current_price_usd or
                listing.price_usd < matched_property.current_price_usd
            ):
                matched_property.current_price_usd = listing.price_usd

            await self._enrich_property_from_listing(matched_property, listing, is_primary=not listing.is_agency)

            logger.info(
                f"Дубликат: listing {listing.external_id} → property {matched_property.id} "
                f"(всего дублей: {matched_property.duplicate_count})"
            )

        else:
            # Новый уникальный объект (или уже есть с тем же fingerprint)
            fp = self._make_fingerprint(listing)
            existing = await self.session.execute(
                select(Property).where(Property.fingerprint == fp).limit(1)
            )
            existing_prop = existing.scalars().first()
            if existing_prop:
                matched_property = existing_prop
                listing.property_id = matched_property.id
                listing.dedup_status = "duplicate"
                matched_property.duplicate_count = (matched_property.duplicate_count or 0) + 1
                if listing.price_usd and (
                    not matched_property.current_price_usd
                    or listing.price_usd < matched_property.current_price_usd
                ):
                    matched_property.current_price_usd = listing.price_usd
                await self._enrich_property_from_listing(matched_property, listing, is_primary=False)
            else:
                raw = listing.raw_data or {}
                resolved_deal = infer_deal_type(
                    listing.price_usd,
                    raw.get("deal_type", "sale"),
                    listing.title or "",
                    listing.description or "",
                )
                new_property = Property(
                    property_type=raw.get("property_type", "apartment"),
                    deal_type=resolved_deal,
                    district=listing.district,
                    street=listing.address_raw,
                    rooms=listing.rooms,
                    floor=listing.floor,
                    total_floors=listing.total_floors,
                    area_sqm=listing.area_sqm,
                    current_price_usd=listing.price_usd,
                    owner_price_usd=listing.price_usd if not listing.is_agency else None,
                    owner_phone=listing.poster_phone if not listing.is_agency else None,
                    is_owner_verified=not listing.is_agency,
                    fingerprint=fp,
                    duplicate_count=0,
                )
                self.session.add(new_property)
                await self.session.flush()

                await self._enrich_property_from_listing(new_property, listing, is_primary=True)

                listing.property_id = new_property.id
                listing.dedup_status = "original"

                logger.info(f"Новый объект создан: {new_property.id} | {listing.rooms}к | ${listing.price_usd}")

        # Записываем в историю цен
        if listing.price_usd and listing.property_id:
            price_record = PriceHistory(
                property_id=listing.property_id,
                listing_id=listing.id,
                price_usd=listing.price_usd,
                price_amd=listing.price_amd,
                source_site=listing.source_site,
                poster_phone=listing.poster_phone,
                note="Агентство" if listing.is_agency else "Собственник/прямое",
            )
            self.session.add(price_record)

        self.session.add(listing)

    async def _find_matching_property(self, listing: Listing) -> Optional[Property]:
        """Ищет совпадение только при сильных сигналах + совпадении параметров."""

        if not listing.rooms or not listing.district:
            return None

        # Сигнал A: pHash фото + те же комнаты, район и похожая площадь
        if listing.photo_hash:
            result = await self.session.execute(
                select(Property)
                .join(Listing, Listing.property_id == Property.id)
                .where(
                    and_(
                        Listing.photo_hash == listing.photo_hash,
                        Property.rooms == listing.rooms,
                        Property.district == listing.district,
                    )
                )
                .limit(1)
            )
            match = result.scalars().first()
            if match and self._area_compatible(listing, match):
                logger.debug(f"  Совпадение по pHash+параметрам: {match.id}")
                return match

        # Сигнал B: точный телефон + район + комнаты + этаж + площадь
        if listing.poster_phone and listing.rooms and listing.floor:
            norm_phone = normalize_phone(listing.poster_phone)
            if not norm_phone:
                return None
            result = await self.session.execute(
                select(Property)
                .join(Listing, Listing.property_id == Property.id)
                .where(
                    and_(
                        Listing.poster_phone == norm_phone,
                        Property.rooms == listing.rooms,
                        Property.floor == listing.floor,
                        Property.district == listing.district,
                    )
                )
                .limit(1)
            )
            match = result.scalars().first()
            if match and self._area_compatible(listing, match):
                logger.debug(f"  Совпадение по телефону+параметрам: {match.id}")
                return match

        return None

    @staticmethod
    def _area_compatible(listing: Listing, prop: Property) -> bool:
        if not listing.area_sqm or not prop.area_sqm:
            return True
        a, b = float(listing.area_sqm), float(prop.area_sqm)
        if a <= 0 or b <= 0:
            return True
        return abs(a - b) / max(a, b) <= 0.12

    async def _enrich_property_from_listing(
        self, prop: Property, listing: Listing, is_primary: bool = False
    ):
        """Продвигает фото и текст с listing → property."""
        if listing.photo_urls:
            existing = list(prop.photo_urls or [])
            merged = existing[:]
            for url in filter_listing_photos(listing.photo_urls):
                if url and url not in merged:
                    merged.append(url)
            prop.photo_urls = merged[:20]

        if is_primary or not prop.title:
            if listing.title:
                prop.title = listing.title
        if listing.description:
            prop.description_raw = listing.description

        if is_primary and (listing.description or listing.title):
            prop.description_clean = fallback_clean(
                listing.description,
                listing.title or "",
                listing.district or "",
                listing.rooms,
            )

        self.session.add(prop)

    def _make_fingerprint(self, listing: Listing) -> str:
        """
        Уникальный отпечаток объекта.
        Если с страницы не извлеклись район/комнаты/этаж — не склеиваем всё в одну кучу:
        каждое объявление остаётся отдельным property до появления данных.
        """
        has_location = bool(
            (listing.district and str(listing.district).strip())
            or (listing.address_raw and str(listing.address_raw).strip())
        )
        has_layout = listing.rooms is not None and listing.floor is not None

        if not has_location or not has_layout:
            site = listing.source_site or "source"
            ext = listing.external_id or str(listing.id)
            raw = f"listing:{site}:{ext}"
            return hashlib.sha256(raw.encode()).hexdigest()[:32]

        return make_property_fingerprint(
            listing.district,
            listing.rooms,
            listing.floor,
            float(listing.area_sqm) if listing.area_sqm else 0,
            (listing.address_raw or "")[:80],
        )
