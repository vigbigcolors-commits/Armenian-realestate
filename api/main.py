"""
SmartEstate Armenia — REST API
"""
import os
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, Any
from decimal import Decimal
from urllib.parse import urlparse, urlencode, parse_qsl, urlunparse

from fastapi import FastAPI, Query, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from loguru import logger

from ai_search import understand_query
from native_listings import (
    router as native_router,
    ListingSubmit,
    create_native_listing,
    filter_display_photo_urls,
    NATIVE_FEED_CLAUSES,
    UPLOAD_DIR,
    normalize_phone,
)
from notify import notify_new_owner_listing
from bot_routes import create_bot_router
from seller_routes import create_seller_router

CONTACT_UNLOCK_AMD = 4000
PRO_SUBSCRIPTION_AMD = 9_000
ALLOW_DEMO_PAYMENTS = os.getenv("ALLOW_DEMO_PAYMENTS", "true").lower() in ("1", "true", "yes")
SALE_MIN_USD = 12_000
RENT_MAX_USD = 15_000

DATABASE_URL = os.getenv("DATABASE_URL", "").replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionFactory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def filter_listing_photo_urls(urls: list | None) -> list | None:
    return filter_display_photo_urls(urls)


# ─── Атрибуция источника ──────────────────────────────────────
# Мы отправляем площадкам живой трафик и явно указываем источник.
# UTM-метки позволяют их аналитике видеть нас как реферера-партнёра.
SOURCE_UTM = {
    "utm_source": "smartestate",
    "utm_medium": "referral",
    "utm_campaign": "listing_attribution",
}


def build_source_link(url: Optional[str]) -> Optional[str]:
    """Добавляет UTM-метки к ссылке на оригинал, сохраняя исходные параметры."""
    if not url or not isinstance(url, str):
        return url
    try:
        parts = urlparse(url)
        query = dict(parse_qsl(parts.query, keep_blank_values=True))
        query.update(SOURCE_UTM)
        return urlunparse(parts._replace(query=urlencode(query)))
    except Exception:  # noqa: BLE001
        return url


def source_site_label(url: Optional[str], fallback: Optional[str] = None) -> Optional[str]:
    """Человекочитаемое имя площадки (list.am) из URL — без маскировки."""
    if fallback:
        return fallback
    if not url:
        return None
    try:
        host = urlparse(url).netloc.lower()
        return host[4:] if host.startswith("www.") else host
    except Exception:  # noqa: BLE001
        return None


def anonymize_poster_name(name: Optional[str], is_agency: Optional[bool]) -> Optional[str]:
    """Скрывает имена посредников: только первые 3 буквы + «…»."""
    if not is_agency:
        return None
    cleaned = (name or "").strip()
    if len(cleaned) < 2:
        return None
    return cleaned[:3] + "…"


def serialize_row(row: dict) -> dict:
    """Конвертирует UUID, Decimal, datetime в JSON-совместимые типы."""
    out = {}
    for k, v in row.items():
        if isinstance(v, uuid.UUID):
            out[k] = str(v)
        elif isinstance(v, Decimal):
            out[k] = float(v)
        elif hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        else:
            out[k] = v
    if out.get("photo_urls") and isinstance(out["photo_urls"], list):
        out["photo_urls"] = filter_listing_photo_urls(out["photo_urls"]) or []
        out["primary_photo_url"] = out["photo_urls"][0] if out["photo_urls"] else None
    elif out.get("primary_photo_url") and "/r/" in str(out["primary_photo_url"]):
        out["primary_photo_url"] = None
    # Атрибуция источника: показываем реальную площадку и ведём трафик к ней
    if out.get("source_url"):
        out["source_site"] = source_site_label(out.get("source_url"), out.get("source_site"))
        out["source_url"] = build_source_link(out["source_url"])
    return out


PROPERTY_LIST_SQL = """
    SELECT p.id, p.deal_type, p.property_type, p.district, p.street, p.rooms, p.floor,
           p.total_floors, p.area_sqm, p.current_price_usd, p.owner_price_usd,
           p.is_owner_verified, p.duplicate_count, p.latitude, p.longitude, p.status,
           p.title, p.description_clean,
           p.photo_urls,
           NULL::text AS source_url,
           'smartestate' AS source_site,
           p.created_at AS published_at
    FROM properties p
    WHERE p.status = 'active' AND p.deal_type = :deal_type
      AND p.source_origin = 'native' AND p.moderation_status = 'approved'
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API запущен")
    yield
    await engine.dispose()


app = FastAPI(
    title="SmartEstate Armenia API",
    description="Агрегатор-очиститель недвижимости Армении",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.include_router(native_router)


async def get_db():
    async with SessionFactory() as session:
        yield session


app.include_router(create_bot_router(get_db))
app.include_router(create_seller_router(get_db))


# ─── Локации по всей Армении ──────────────────────────────────
YEREVAN_DISTRICTS = [
    "Арабкир", "Центр", "Аван", "Нор Норк", "Канакер-Зейтун",
    "Аджапняк", "Давидашен", "Еребуни", "Малатия-Себастия", "Шенгавит",
    "Норк-Мараш", "Нубарашен",
]

REGION_CITIES = [
    # Котайк
    "Абовян", "Раздан", "Цахкадзор", "Чаренцаван", "Егвард",
    # Ширак
    "Гюмри", "Артик",
    # Лори
    "Ванадзор", "Степанаван", "Алаверди", "Спитак",
    # Тавуш
    "Дилижан", "Иджеван", "Берд", "Ноемберян",
    # Гегаркуник
    "Севан", "Гавар", "Мартуни", "Варденис",
    # Армавир
    "Армавир", "Эчмиадзин", "Метсамор",
    # Арарат
    "Арташат", "Масис", "Арарат", "Веди",
    # Арагацотн
    "Аштарак", "Апаран", "Талин",
    # Вайоц Дзор
    "Джермук", "Ехегнадзор", "Вайк",
    # Сюник
    "Капан", "Горис", "Сисиан", "Мегри", "Каджаран",
]

DISTRICTS = YEREVAN_DISTRICTS + REGION_CITIES

# Алиасы для разбора запроса: вариант написания → каноничное имя
LOCATION_ALIASES: dict[str, str] = {}
for _name in DISTRICTS:
    LOCATION_ALIASES[_name.lower()] = _name
LOCATION_ALIASES.update({
    "кентрон": "Центр", "центре": "Центр", "центра": "Центр",
    "kentron": "Центр", "center": "Центр", "centre": "Центр",
    "вагаршапат": "Эчмиадзин", "эчмиадзине": "Эчмиадзин", "ejmiatsin": "Эчмиадзин",
    "gyumri": "Гюмри", "гюмри́": "Гюмри",
    "vanadzor": "Ванадзор", "dilijan": "Дилижан", "дилижане": "Дилижан",
    "jermuk": "Джермук", "джермуке": "Джермук",
    "sevan": "Севан", "севане": "Севан",
    "abovyan": "Абовян", "hrazdan": "Раздан", "tsaghkadzor": "Цахкадзор",
    "капане": "Капан", "kapan": "Капан", "goris": "Горис",
    "арабкире": "Арабкир", "аване": "Аван",
})

# Ориентиры Еревана → район (для запросов «возле оперы» и т.п.)
LANDMARK_TO_DISTRICT: dict[str, str] = {
    "опер": "Центр", "оперы": "Центр", "оперн": "Центр",
    "каскад": "Центр", "вернисаж": "Центр", "матенадаран": "Центр",
    "площадь республики": "Центр", "республик": "Центр",
    "северный проспект": "Центр", "северном проспекте": "Центр",
    "драматическ": "Центр", "москва кинотеатр": "Центр",
    "цирк": "Шенгавит", "разданское ущелье": "Центр",
    "зоопарк": "Канакер-Зейтун", "далма": "Аджапняк",
}


def build_property_filters(
    deal_type: str,
    rooms: Optional[int] = None,
    district: Optional[str] = None,
    price_min: Optional[int] = None,
    price_max: Optional[int] = None,
    area_min: Optional[float] = None,
    area_max: Optional[float] = None,
    date_from: Optional[datetime] = None,
    property_type: Optional[str] = None,
    keywords: Optional[list[str]] = None,
) -> tuple[list[str], dict[str, Any]]:
    clauses = ["p.status = 'active'", "p.deal_type = :deal_type", *NATIVE_FEED_CLAUSES]
    params: dict[str, Any] = {"deal_type": deal_type}

    clauses.append("(p.photo_urls IS NOT NULL AND cardinality(p.photo_urls) > 0)")

    if deal_type == "sale":
        clauses.append("p.current_price_usd >= :sale_price_floor")
        params["sale_price_floor"] = SALE_MIN_USD
    elif deal_type == "rent":
        clauses.append("p.current_price_usd <= :rent_price_ceiling")
        params["rent_price_ceiling"] = RENT_MAX_USD

    if rooms is not None:
        clauses.append("p.rooms = :rooms")
        params["rooms"] = rooms
    if property_type:
        clauses.append("p.property_type = :property_type")
        params["property_type"] = property_type
    if district:
        clauses.append("p.district ILIKE :district")
        params["district"] = f"%{district}%"
    if price_min is not None:
        clauses.append("p.current_price_usd >= :price_min")
        params["price_min"] = price_min
    if price_max is not None:
        clauses.append("p.current_price_usd <= :price_max")
        params["price_max"] = price_max
    if area_min is not None:
        clauses.append("p.area_sqm >= :area_min")
        params["area_min"] = area_min
    if area_max is not None:
        clauses.append("p.area_sqm <= :area_max")
        params["area_max"] = area_max
    if date_from:
        clauses.append("p.created_at >= :date_from")
        params["date_from"] = date_from

    # Полнотекст по ключевым словам: каждое слово должно встретиться
    # где-то (заголовок / описание / улица / район / текст объявлений).
    if keywords:
        for i, kw in enumerate(keywords):
            key = f"kw{i}"
            clauses.append(
                f"(p.title ILIKE :{key} OR p.description_raw ILIKE :{key} "
                f"OR p.street ILIKE :{key} OR p.district ILIKE :{key} "
                f"OR EXISTS (SELECT 1 FROM listings lk WHERE lk.property_id = p.id "
                f"AND (lk.title ILIKE :{key} OR lk.description ILIKE :{key})))"
            )
            params[key] = f"%{kw}%"

    return clauses, params


def _parse_amount(raw: str) -> Optional[int]:
    """'350 000', '1.2млн', '2 000$' → int (USD-ish, множители k/млн)."""
    s = raw.lower().replace(" ", "").replace("\xa0", "").replace(",", ".")
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if not m:
        return None
    val = float(m.group(1))
    if "млн" in s or "миллион" in s or "mln" in s:
        val *= 1_000_000
    elif re.search(r"\d\s*(к|k|тыс|thousand)", s):
        val *= 1_000
    return int(val)


def parse_natural_query(q: str) -> dict:
    """
    Гибкий разбор естественного запроса (RU/EN/HY-lite).
    Понимает: тип сделки, комнаты, цену (от/до), локацию, ориентиры,
    и намерение сортировки («самые дешёвые», «ниже рыночного», «свежие»).
    """
    text_lower = q.lower()
    params: dict[str, Any] = {}

    # ── Тип сделки ──
    if any(w in text_lower for w in ("аренд", "снять", "снимаю", "сдаёт", "сдается", "сдаётся", "rent")):
        params["deal_type"] = "rent"
    elif any(w in text_lower for w in ("продаж", "купить", "куплю", "покупк", "sale", "buy")):
        params["deal_type"] = "sale"

    # ── Комнаты ──
    rooms_match = re.search(r"(\d)\s*(?:комнат|-комн|\s*к\b|комн|room|սեն)", text_lower)
    if rooms_match:
        params["rooms"] = int(rooms_match.group(1))
    elif "студи" in text_lower or "studio" in text_lower:
        params["rooms"] = 1
    elif "однушк" in text_lower or "1-комн" in text_lower or "одноком" in text_lower:
        params["rooms"] = 1
    elif "двушк" in text_lower or "2-комн" in text_lower or "двухком" in text_lower:
        params["rooms"] = 2
    elif "трёшк" in text_lower or "трешк" in text_lower or "3-комн" in text_lower or "трёхком" in text_lower or "трехком" in text_lower:
        params["rooms"] = 3

    # ── Цена: «до N», «от N», «дешевле N», «дороже N» ──
    max_match = re.search(r"(?:до|дешевле|не дороже|под|максимум|max|up to|<)\s*\$?֏?\s*([\d.,\s]+\s*(?:млн|миллион|тыс|k|к)?)", text_lower)
    if max_match:
        amt = _parse_amount(max_match.group(1))
        if amt:
            params["price_max"] = amt
    min_match = re.search(r"(?:от|дороже|начиная|минимум|min|from|>)\s*\$?֏?\s*([\d.,\s]+\s*(?:млн|миллион|тыс|k|к)?)", text_lower)
    if min_match:
        amt = _parse_amount(min_match.group(1))
        if amt:
            params["price_min"] = amt

    # ── Локация: сначала явные названия, затем ориентиры ──
    matched_location = None
    for alias, canonical in LOCATION_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}", text_lower):
            matched_location = canonical
            break
    if not matched_location:
        for landmark, district in LANDMARK_TO_DISTRICT.items():
            if landmark in text_lower:
                matched_location = district
                break
    if matched_location:
        params["district"] = matched_location

    # ── Намерение сортировки ──
    if any(w in text_lower for w in (
        "ниже рыночн", "ниже рынка", "недооцен", "выгодн", "по акции",
        "хорошая сделка", "хорошую сделку", "лучшая цена", "лучшую цену",
    )):
        params["sort"] = "deal"
    elif any(w in text_lower for w in (
        "самые низк", "самая низк", "самые дешёв", "самые дешев", "дешевле всего",
        "подешевле", "недорог", "бюджет", "низкая цена", "низкие цены",
        "самые доступн", "cheap",
    )):
        params["sort"] = "price_asc"
    elif any(w in text_lower for w in (
        "дорог", "премиум", "элитн", "люкс", "самые дорог", "expensive", "luxury",
    )):
        params["sort"] = "price_desc"
    elif any(w in text_lower for w in (
        "новые", "свежие", "недавн", "последн", "только что", "new", "latest",
    )):
        params["sort"] = "recent"

    return params


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SmartEstate Armenia API"}


@app.get("/api/system/status")
async def system_status(db: AsyncSession = Depends(get_db)):
    """Сводка для smoke-тестов и мониторинга."""
    row = await db.execute(text("""
        SELECT
            (SELECT COUNT(*) FROM properties WHERE status = 'active') AS active_properties,
            (SELECT COUNT(*) FROM listings) AS total_listings,
            (SELECT COUNT(*) FROM listings
             WHERE photo_urls IS NOT NULL AND cardinality(photo_urls) > 0) AS listings_with_photos,
            (SELECT COUNT(*) FROM properties
             WHERE photo_urls IS NOT NULL AND cardinality(photo_urls) > 0) AS properties_with_photos,
            (SELECT COUNT(*) FROM properties WHERE description_clean IS NOT NULL) AS properties_with_clean_desc,
            (SELECT COUNT(*) FROM price_alerts WHERE is_active = TRUE) AS active_price_alerts,
            (SELECT COUNT(*) FROM users WHERE plan = 'pro') AS pro_users
    """))
    data = serialize_row(dict(row.mappings().first()))
    data["phase4_ready"] = data.get("properties_with_photos", 0) > 0
    data["phase5_ready"] = True
    return data


class PriceAlertCreate(BaseModel):
    telegram_id: int
    deal_type: str = "rent"
    district: Optional[str] = None
    rooms: Optional[int] = None
    price_max_usd: Optional[int] = None


@app.post("/api/alerts/price")
async def create_price_alert(body: PriceAlertCreate, db: AsyncSession = Depends(get_db)):
    """Фаза 5: подписка на новые объекты по фильтру."""
    if body.deal_type not in ("rent", "sale"):
        raise HTTPException(status_code=400, detail="deal_type must be rent or sale")

    await db.execute(
        text("""
            INSERT INTO price_alerts (telegram_id, deal_type, district, rooms, price_max_usd)
            VALUES (:telegram_id, :deal_type, :district, :rooms, :price_max_usd)
            ON CONFLICT (telegram_id, deal_type, district, rooms, price_max_usd)
            DO UPDATE SET is_active = TRUE, updated_at = NOW()
        """),
        {
            "telegram_id": body.telegram_id,
            "deal_type": body.deal_type,
            "district": body.district,
            "rooms": body.rooms,
            "price_max_usd": body.price_max_usd,
        },
    )
    await db.commit()
    return {"status": "subscribed"}


@app.get("/api/alerts/price/{telegram_id}")
async def list_price_alerts(telegram_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT id, deal_type, district, rooms, price_max_usd, is_active, created_at
            FROM price_alerts WHERE telegram_id = :tid AND is_active = TRUE
            ORDER BY created_at DESC
        """),
        {"tid": telegram_id},
    )
    return [serialize_row(dict(r)) for r in result.mappings().all()]


@app.get("/api/properties/price-bounds")
async def property_price_bounds(
    deal_type: str = Query("sale"),
    db: AsyncSession = Depends(get_db),
):
    """Диапазон цен для ползунков (по активным объектам)."""
    extra = ""
    params: dict[str, Any] = {"deal_type": deal_type}
    if deal_type == "sale":
        extra = " AND current_price_usd >= :sale_floor"
        params["sale_floor"] = SALE_MIN_USD
    elif deal_type == "rent":
        extra = " AND current_price_usd <= :rent_ceiling"
        params["rent_ceiling"] = RENT_MAX_USD

    # Робастные границы: реальные min/max карточек, но без явных выбросов
    # (опечатки вроде $2 за аренду или $25 млн за квартиру ломают ползунок).
    # Берём 1-й и 99-й перцентили — это покрывает практически все объявления.
    row = await db.execute(
        text(f"""
            SELECT
                COALESCE(MIN(current_price_usd) FILTER (WHERE current_price_usd > 0), 0) AS abs_min,
                COALESCE(MAX(current_price_usd), 0) AS abs_max,
                PERCENTILE_CONT(0.01) WITHIN GROUP (
                    ORDER BY current_price_usd
                ) FILTER (WHERE current_price_usd > 0) AS p_low,
                PERCENTILE_CONT(0.99) WITHIN GROUP (
                    ORDER BY current_price_usd
                ) FILTER (WHERE current_price_usd > 0) AS p_high
            FROM properties
            WHERE status = 'active' AND deal_type = :deal_type
              AND source_origin = 'native' AND moderation_status = 'approved'{extra}
        """),
        params,
    )
    data = dict(row.mappings().first())
    abs_min = int(data.get("abs_min") or 0)
    abs_max = int(data.get("abs_max") or 0)
    p_low = data.get("p_low")
    p_high = data.get("p_high")

    min_p = int(p_low) if p_low is not None else abs_min
    max_p = int(p_high) if p_high is not None else abs_max
    # не выходим за фактические границы
    min_p = max(min_p, abs_min)
    max_p = min(max_p, abs_max) if abs_max else max_p

    if max_p <= min_p:
        max_p = min_p + (3000 if deal_type == "rent" else 500000)
    return {"deal_type": deal_type, "min_price": min_p, "max_price": max_p}


# Порядок сортировки: приоритет фото всегда первым, затем намерение
_HAS_PHOTO_RANK = (
    "CASE WHEN p.photo_urls IS NOT NULL AND cardinality(p.photo_urls) > 0 "
    "THEN 0 ELSE 1 END"
)
SORT_ORDERS = {
    "recent": f"{_HAS_PHOTO_RANK}, p.created_at DESC",
    "price_asc": f"{_HAS_PHOTO_RANK}, p.current_price_usd ASC NULLS LAST, p.created_at DESC",
    "price_desc": f"{_HAS_PHOTO_RANK}, p.current_price_usd DESC NULLS LAST, p.created_at DESC",
    "deal": f"{_HAS_PHOTO_RANK}, p.current_price_usd ASC NULLS LAST, p.created_at DESC",
}


@app.get("/api/properties")
async def search_properties(
    deal_type: str = Query("sale"),
    rooms: Optional[int] = Query(None),
    district: Optional[str] = Query(None),
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    area_min: Optional[float] = Query(None),
    area_max: Optional[float] = Query(None),
    date_from: Optional[str] = Query(None, description="ISO-дата: только объявления с этой даты"),
    sort: Optional[str] = Query(None, description="recent|price_asc|price_desc|deal"),
    q: Optional[str] = Query(None, description="Поиск на естественном языке"),
    limit: int = Query(24, le=60),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    dt_from: Optional[datetime] = None
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
        except ValueError:
            dt_from = None

    parsed_meta: dict[str, Any] = {}
    property_type: Optional[str] = None
    keywords: list[str] = []
    ai_used = False
    if q:
        parsed = await understand_query(q, LOCATION_ALIASES, LANDMARK_TO_DISTRICT, DISTRICTS)
        parsed_meta = {k: v for k, v in parsed.items() if not k.startswith("_")}
        ai_used = bool(parsed.get("_ai"))
        # Явно выбранные пользователем контролы (район/комнаты/цена) ГЛАВНЕЕ
        # распознанного из текста — иначе выбор в списке «перебивался» бы фразой.
        deal_type = parsed.get("deal_type") or deal_type
        rooms = rooms if rooms is not None else parsed.get("rooms")
        district = district or parsed.get("district")
        price_max = price_max if price_max is not None else parsed.get("price_max")
        price_min = price_min if price_min is not None else parsed.get("price_min")
        # тип жилья и ключевые слова из текста игнорируем, если явно задан район,
        # чтобы «дом» из старой фразы не сужал явно выбранный район
        property_type = parsed.get("property_type")
        keywords = parsed.get("keywords") or []
        if district and district != parsed.get("district"):
            # пользователь явно выбрал другой район — не тащим текстовые уточнения
            property_type = None
            keywords = []
        if not sort and parsed.get("sort"):
            sort = parsed["sort"]

    async def run_query(f: dict[str, Any]) -> tuple[int, list[dict]]:
        clauses, params = build_property_filters(
            deal_type=deal_type,
            rooms=f.get("rooms"),
            district=f.get("district"),
            price_min=f.get("price_min"),
            price_max=f.get("price_max"),
            area_min=area_min,
            area_max=area_max,
            date_from=f.get("date_from"),
            property_type=f.get("property_type"),
            keywords=f.get("keywords"),
        )
        where_sql = " AND ".join(clauses)
        count_result = await db.execute(
            text(f"SELECT COUNT(*) AS total FROM properties p WHERE {where_sql}"), params,
        )
        total = int(count_result.scalar() or 0)
        if total == 0:
            return 0, []
        extra = [c for c in clauses if c not in ("p.status = 'active'", "p.deal_type = :deal_type")]
        sql = PROPERTY_LIST_SQL
        if extra:
            sql += " AND " + " AND ".join(extra)
        order_sql = SORT_ORDERS.get(sort or "recent", SORT_ORDERS["recent"])
        sql += f"\n ORDER BY {order_sql}\n LIMIT :limit OFFSET :offset"
        result = await db.execute(text(sql), {**params, "limit": limit, "offset": offset})
        return total, [serialize_row(dict(r)) for r in result.mappings().all()]

    # Полный набор фильтров, затем — прогрессивное смягчение, чтобы
    # пользователь всегда получал релевантные результаты, а не «ничего не найдено».
    base_filters: dict[str, Any] = {
        "rooms": rooms, "district": district, "price_min": price_min,
        "price_max": price_max, "date_from": dt_from,
        "property_type": property_type, "keywords": keywords or None,
    }
    # Каждый шаг убирает наименее важное ограничение (сохраняя район и тип сделки).
    relax_steps = [
        ("keywords", None), ("property_type", None), ("rooms", None),
        ("price_min", None), ("price_max", None), ("date_from", None),
    ]

    total, items = await run_query(base_filters)
    relaxed: list[str] = []
    current = dict(base_filters)
    for field, val in relax_steps:
        if total > 0:
            break
        if current.get(field) is None:
            continue
        current[field] = val
        relaxed.append(field)
        total, items = await run_query(current)

    # Последний рубеж: если и с районом пусто, а был свободный текст —
    # ищем только по ключевым словам в пределах типа сделки.
    if total == 0 and (keywords or district):
        current = {k: None for k in base_filters}
        current["keywords"] = keywords or ([district.lower()] if district else None)
        relaxed.append("district")
        total, items = await run_query(current)

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
        "has_more": offset + len(items) < total,
        "applied": {
            "deal_type": deal_type,
            "rooms": rooms,
            "district": district,
            "price_min": price_min,
            "price_max": price_max,
            "property_type": property_type,
            "sort": sort or "recent",
            "keywords": keywords or None,
            "relaxed": relaxed or None,
            "ai": ai_used,
            "parsed": parsed_meta or None,
        },
    }


@app.get("/api/properties/{property_id}")
async def get_property_detail(property_id: str, db: AsyncSession = Depends(get_db)):
    prop = await db.execute(
        text("SELECT * FROM properties WHERE id = :id"),
        {"id": property_id},
    )
    prop_row = prop.mappings().first()
    if not prop_row:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if prop_row.get("source_origin") != "native" or prop_row.get("moderation_status") != "approved":
        raise HTTPException(status_code=404, detail="Объект не найден")

    history = await db.execute(
        text("""
            SELECT recorded_at, price_usd, note, source_site
            FROM price_history WHERE property_id = :id ORDER BY recorded_at ASC
        """),
        {"id": property_id},
    )

    listings = await db.execute(
        text("""
            SELECT source_url, poster_name, poster_phone, price_usd,
                   source_site, is_agency, scraped_at, title, description, photo_urls
            FROM listings WHERE property_id = :id ORDER BY price_usd ASC
        """),
        {"id": property_id},
    )
    listing_rows = [serialize_row(dict(r)) for r in listings.mappings().all()]

    for lst in listing_rows:
        # Никаких телефонов в открытом ответе — только после оплаты
        lst.pop("poster_phone", None)
        # Имена посредников анонимны — не обижаем никого
        lst["poster_name"] = anonymize_poster_name(lst.get("poster_name"), lst.get("is_agency"))
        # source_url/source_site уже обогащены UTM в serialize_row — не маскируем

    prop_data = serialize_row(dict(prop_row))
    hide_phone = bool(prop_data.pop("hide_phone", False))
    contact_email = prop_data.pop("contact_email", None)
    contact_phone = prop_data.pop("owner_phone", None) or prop_data.pop("contact_phone", None)
    contact_name = prop_data.get("contact_name")
    if hide_phone:
        contact_phone = None
        if contact_email:
            prop_data["contact_email"] = contact_email
    elif contact_phone:
        prop_data["contact_phone"] = contact_phone
    prop_data["contact_name"] = contact_name
    prop_data["hide_phone"] = hide_phone
    contact_available = bool(contact_phone or contact_email) or any(
        (lst.get("poster_phone") or "").strip() for lst in listing_rows
    )
    # Ссылка на оригинал для шапки объекта: берём канонический источник
    best_source = next(
        (l for l in listing_rows if l.get("source_url") and l.get("is_agency") is False),
        next((l for l in listing_rows if l.get("source_url")), None),
    )
    if best_source:
        prop_data["source_url"] = best_source["source_url"]
        prop_data["source_site"] = best_source.get("source_site")
    if not prop_data.get("photo_urls") and listing_rows:
        for lst in listing_rows:
            if lst.get("photo_urls"):
                prop_data["photo_urls"] = lst["photo_urls"]
                prop_data["primary_photo_url"] = lst["photo_urls"][0]
                break

    return {
        "property": prop_data,
        "contact_available": contact_available,
        "contact_phone": contact_phone,
        "contact_email": contact_email if hide_phone else None,
        "contact_name": contact_name,
        "price_history": [serialize_row(dict(r)) for r in history.mappings().all()],
        "all_listings": listing_rows,
        "duplicate_count": prop_data.get("duplicate_count") or len([l for l in listing_rows if l.get("is_agency")]),
    }


@app.get("/api/stats")
async def platform_stats(db: AsyncSession = Depends(get_db)):
    # Считаем только «чистые» данные — те, что реально показываем: активные
    # объекты с настоящим фото (/f/). Так цифры честные и не раздуваются
    # мусором из прошлого (объявления без фото мы больше не собираем).
    result = await db.execute(text("""
        SELECT
            (SELECT COUNT(*) FROM properties
             WHERE status = 'active' AND source_origin = 'native'
               AND moderation_status = 'approved'
               AND photo_urls IS NOT NULL AND cardinality(photo_urls) > 0) AS active_properties,
            (SELECT COUNT(*) FROM listings WHERE source_site = 'smartestate') AS total_listings,
            0 AS duplicates_removed,
            (SELECT COUNT(*) FROM properties
             WHERE status = 'active' AND source_origin = 'native'
               AND is_owner_verified = TRUE) AS verified_owners
    """))
    return serialize_row(dict(result.mappings().first()))


@app.get("/api/districts")
async def get_districts():
    return DISTRICTS


@app.get("/api/pro-users")
async def get_pro_users(db: AsyncSession = Depends(get_db)):
    """Telegram ID агентов с активным Pro (для мгновенных уведомлений)."""
    result = await db.execute(text("""
        SELECT telegram_id FROM users
        WHERE plan = 'pro' AND telegram_id IS NOT NULL
          AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
    """))
    return [row[0] for row in result.fetchall()]


async def _resolve_contact_phone(db: AsyncSession, property_id: str) -> Optional[str]:
    prop = await db.execute(
        text("SELECT owner_phone, is_owner_verified FROM properties WHERE id = :id"),
        {"id": property_id},
    )
    row = prop.mappings().first()
    if row and row.get("owner_phone"):
        return str(row["owner_phone"])

    listings = await db.execute(
        text("""
            SELECT poster_phone FROM listings
            WHERE property_id = :id AND poster_phone IS NOT NULL AND poster_phone != ''
            ORDER BY CASE WHEN is_agency = FALSE THEN 0 ELSE 1 END, price_usd ASC NULLS LAST
            LIMIT 1
        """),
        {"id": property_id},
    )
    lst = listings.mappings().first()
    if lst and lst.get("poster_phone"):
        return str(lst["poster_phone"])
    return None


class UnlockContactBody(BaseModel):
    property_id: str
    client_token: str
    payment_method: str = "demo"


class ProSubscribeBody(BaseModel):
    client_token: Optional[str] = None
    telegram_id: Optional[int] = None
    payment_method: str = "demo"


@app.get("/api/payments/contact-status")
async def contact_unlock_status(
    property_id: str = Query(...),
    client_token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        text("""
            SELECT 1 FROM contact_unlocks
            WHERE property_id = :pid AND client_token = :tok
        """),
        {"pid": property_id, "tok": client_token},
    )
    if not row.first():
        return {"status": "locked", "unlocked": False, "amount_amd": CONTACT_UNLOCK_AMD}

    phone = await _resolve_contact_phone(db, property_id)
    return {"status": "unlocked", "unlocked": True, "phone": phone}


@app.post("/api/payments/unlock-contact")
async def unlock_contact(body: UnlockContactBody, db: AsyncSession = Depends(get_db)):
    phone = await _resolve_contact_phone(db, body.property_id)
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not available for this property")

    existing = await db.execute(
        text("""
            SELECT 1 FROM contact_unlocks
            WHERE property_id = :pid AND client_token = :tok
        """),
        {"pid": body.property_id, "tok": body.client_token},
    )
    if existing.first():
        return {"status": "unlocked", "unlocked": True, "phone": phone}

    if body.payment_method == "idram":
        intent_id = uuid.uuid4()
        await db.execute(
            text("""
                INSERT INTO payment_intents (id, client_token, intent_type, property_id, amount_amd, status, provider)
                VALUES (:id, :tok, 'contact_unlock', :pid, :amt, 'pending', 'idram')
            """),
            {
                "id": intent_id,
                "tok": body.client_token,
                "pid": body.property_id,
                "amt": CONTACT_UNLOCK_AMD,
            },
        )
        await db.commit()
        return {
            "status": "pending",
            "unlocked": False,
            "amount_amd": CONTACT_UNLOCK_AMD,
            "checkout_hint": "Idram integration pending",
        }

    if body.payment_method != "demo" or not ALLOW_DEMO_PAYMENTS:
        raise HTTPException(status_code=400, detail="Payment method not available")

    await db.execute(
        text("""
            INSERT INTO contact_unlocks (property_id, client_token, amount_amd, payment_method)
            VALUES (:pid, :tok, :amt, 'demo')
            ON CONFLICT (property_id, client_token) DO NOTHING
        """),
        {"pid": body.property_id, "tok": body.client_token, "amt": CONTACT_UNLOCK_AMD},
    )
    await db.commit()
    return {"status": "unlocked", "unlocked": True, "phone": phone, "amount_amd": CONTACT_UNLOCK_AMD}


@app.post("/api/payments/subscribe-pro")
async def subscribe_pro(body: ProSubscribeBody, db: AsyncSession = Depends(get_db)):
    if body.payment_method == "idram":
        intent_id = uuid.uuid4()
        await db.execute(
            text("""
                INSERT INTO payment_intents (id, client_token, telegram_id, intent_type, amount_amd, status, provider)
                VALUES (:id, :tok, :tid, 'pro_subscription', :amt, 'pending', 'idram')
            """),
            {
                "id": intent_id,
                "tok": body.client_token,
                "tid": body.telegram_id,
                "amt": PRO_SUBSCRIPTION_AMD,
            },
        )
        await db.commit()
        return {"status": "pending", "amount_amd": PRO_SUBSCRIPTION_AMD}

    if body.payment_method != "demo" or not ALLOW_DEMO_PAYMENTS:
        raise HTTPException(status_code=400, detail="Payment method not available")

    if body.telegram_id:
        await db.execute(
            text("""
                INSERT INTO users (telegram_id, plan, plan_expires_at, role)
                VALUES (:tid, 'pro', NOW() + INTERVAL '30 days', 'agent')
                ON CONFLICT (telegram_id) DO UPDATE SET
                    plan = 'pro',
                    plan_expires_at = NOW() + INTERVAL '30 days',
                    role = 'agent'
            """),
            {"tid": body.telegram_id},
        )
    await db.commit()
    return {"status": "paid", "plan": "pro", "days": 30}


@app.post("/api/payments/webhook")
async def payment_webhook(payload: dict, db: AsyncSession = Depends(get_db)):
    """
  Заглушка для Idram/Ameriabank.
  Когда платёж подтверждён — активируем Pro.
  """
    telegram_id = payload.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=400, detail="telegram_id required")

    await db.execute(
        text("""
            INSERT INTO users (telegram_id, plan, plan_expires_at, role)
            VALUES (:tid, 'pro', NOW() + INTERVAL '30 days', 'agent')
            ON CONFLICT (telegram_id) DO UPDATE SET
                plan = 'pro',
                plan_expires_at = NOW() + INTERVAL '30 days',
                role = 'agent'
        """),
        {"tid": telegram_id},
    )
    await db.commit()
    return {"status": "ok", "plan": "pro", "days": 30}


@app.post("/api/listings/submit")
async def submit_listing(
    body: ListingSubmit,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Публикация объявления собственником на платформе."""
    poster_user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        sess = await db.execute(
            text("SELECT user_id FROM user_sessions WHERE token = :tok AND expires_at > NOW()"),
            {"tok": token},
        )
        row = sess.first()
        if row:
            poster_user_id = str(row[0])

    result = await create_native_listing(body, db, poster_user_id=poster_user_id)
    await db.commit()

    phone = normalize_phone(body.contact_phone or "") if body.contact_phone else ""
    price_usd = max(1, body.price_amd // int(os.getenv("AMD_TO_USD_RATE", "390")))

    await notify_new_owner_listing({
        "property_id": result["id"],
        "title": body.title.strip(),
        "deal_type": body.deal_type,
        "property_type": body.property_type,
        "district": body.district.strip(),
        "street": (body.street or "").strip() or None,
        "rooms": body.rooms,
        "floor": body.floor,
        "total_floors": body.total_floors,
        "area_sqm": body.area_sqm,
        "price_usd": price_usd,
        "price_amd": body.price_amd,
        "contact_name": body.contact_name.strip(),
        "contact_phone": phone or None,
        "contact_email": (body.contact_email or "").strip() or None,
        "hide_phone": body.hide_phone,
        "photo_urls": body.photo_urls,
        "is_agency": False,
        "source": "native",
    })
    return result
