"""
Парсер List.am — Цех 1 «Добыча сырья»

Логика:
1. Проходим по страницам категории (список объявлений)
2. Собираем ссылки на каждое объявление
3. Заходим на каждое объявление, извлекаем все данные
4. Сохраняем в таблицу listings (сырая руда)
"""
import asyncio
import re
import hashlib
from typing import Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings, LISTAM_TARGETS, _LOCATION_LOOKUP
from deal_type_utils import infer_deal_type
from photos import extract_photo_urls, has_real_photo

try:
    from curl_cffi.requests import AsyncSession as CurlAsyncSession
    HAS_CURL = True
except ImportError:
    HAS_CURL = False

# Стабильный Chrome UA — случайные UA часто ловят 403
DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

def get_headers(referer: str = "https://www.list.am/") -> dict:
    return {
        "User-Agent": DEFAULT_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "hy-AM,hy;q=0.9,ru-RU,ru;q=0.8,en-US;q=0.7,en;q=0.6",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": referer,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Upgrade-Insecure-Requests": "1",
    }


# ─── Нормализация цены ────────────────────────────────────────
def parse_price(price_text: str) -> tuple[Optional[int], Optional[int], str]:
    """Возвращает (price_usd, price_amd, currency)"""
    if not price_text:
        return None, None, "AMD"

    price_text = price_text.strip().replace("\xa0", "").replace(",", "")
    numbers = re.findall(r"\d+", price_text)
    if not numbers:
        return None, None, "AMD"

    amount = int("".join(numbers))

    if "$" in price_text or "USD" in price_text.upper():
        return amount, amount * int(settings.amd_to_usd_rate), "USD"
    else:
        usd = amount // int(settings.amd_to_usd_rate)
        return usd, amount, "AMD"


# ─── Нормализация локации (Ереван + регионы Армении) ──────────
def extract_district(text: str) -> Optional[str]:
    """Возвращает каноничное русское имя района/города по любому варианту."""
    if not text:
        return None
    text_lower = text.lower()
    # Длинные алиасы первыми, чтобы «нор норк» не срабатывал как «норк»
    for alias in sorted(_LOCATION_LOOKUP.keys(), key=len, reverse=True):
        if alias in text_lower:
            return _LOCATION_LOOKUP[alias]
    return None


# ─── Определяем агента или собственника ──────────────────────
AGENCY_KEYWORDS = [
    "агентство", "агент", "риелтор", "риэлтор", "agency", "agent",
    "realty", "недвижимость", "estate", "broker", "not", "groupe",
]

def is_agency_poster(name: str, description: str) -> bool:
    combined = f"{name or ''} {description or ''}".lower()
    return any(kw in combined for kw in AGENCY_KEYWORDS)


# ─── Генерация fingerprint для объявления ────────────────────
def make_listing_fingerprint(external_id: str, source_site: str) -> str:
    raw = f"{source_site}:{external_id}"
    return hashlib.md5(raw.encode()).hexdigest()


# ─── Парсинг диалога с телефоном (/rtam?i=<id>&_rtt=1) ────────
def item_id_from_url(url: str) -> Optional[str]:
    m = re.search(r"/item/(\d+)", url or "")
    return m.group(1) if m else None


def parse_phone_dialog(html: str) -> dict:
    """
    Разбирает ответ /rtam — там реальный контакт продавца.
    Возвращает {phone, poster_name, poster_user_id, poster_rating, poster_tenure}.
    """
    result: dict = {
        "phone": None,
        "poster_name": None,
        "poster_user_id": None,
        "poster_rating": None,
        "poster_tenure": None,
    }
    if not html:
        return result

    soup = BeautifulSoup(html, "lxml")

    # Телефон: самый надёжный источник — ссылка tel:
    tel = soup.select_one("a[href^='tel:']")
    if tel and tel.get("href"):
        digits = re.sub(r"[^\d]", "", tel["href"].split("tel:", 1)[-1])
        if len(digits) >= 8:
            result["phone"] = digits
    if not result["phone"]:
        m = re.search(r"(?:\+374|0)\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}", html)
        if m:
            result["phone"] = re.sub(r"[^\d]", "", m.group())

    # Имя продавца
    name_tag = soup.select_one(".nmsp") or soup.select_one(".username .nmsp") or soup.select_one(".username")
    if name_tag:
        result["poster_name"] = name_tag.get_text(strip=True) or None

    # ID пользователя list.am (стабильный идентификатор продавца)
    user_link = soup.select_one("a[href^='/user/']")
    if user_link and user_link.get("href"):
        um = re.search(r"/user/(\d+)", user_link["href"])
        if um:
            result["poster_user_id"] = um.group(1)

    # Рейтинг и стаж (мягко, best-effort)
    rating_tag = soup.select_one(".reviews")
    if rating_tag:
        rm = re.search(r"[\d.]+", rating_tag.get_text(strip=True))
        if rm:
            try:
                result["poster_rating"] = float(rm.group())
            except ValueError:
                pass
    tenure_tag = soup.select_one(".UserTenureComponent") or soup.select_one(".since")
    if tenure_tag:
        result["poster_tenure"] = tenure_tag.get_text(" ", strip=True) or None

    return result


# ─── Парсинг страницы-карточки объявления ────────────────────
def parse_listing_page(html: str, url: str, deal_type: str, property_type: str) -> dict:
    """Разбирает HTML одного объявления, возвращает словарь с данными."""
    soup = BeautifulSoup(html, "lxml")
    data = {
        "source_url": url,
        "source_site": "list.am",
        "deal_type": deal_type,
        "property_type": property_type,
        "is_active": True,
        "dedup_status": "pending",
    }

    # Внешний ID из URL (последний числовой сегмент)
    id_match = re.search(r"/item/(\d+)", url)
    data["external_id"] = id_match.group(1) if id_match else None

    # Заголовок
    title_tag = soup.select_one("h1.lname") or soup.select_one("h1")
    data["title"] = title_tag.get_text(strip=True) if title_tag else None

    # Цена
    price_tag = soup.select_one(".price") or soup.select_one("[class*='price']")
    if price_tag:
        price_text = price_tag.get_text(strip=True)
        data["price_usd"], data["price_amd"], data["currency"] = parse_price(price_text)

    # Телефон
    phone_tag = soup.select_one(".phone") or soup.select_one("[class*='phone']")
    if phone_tag:
        phone_raw = phone_tag.get_text(strip=True)
        data["poster_phone"] = re.sub(r"[^\d+]", "", phone_raw) or None

    # Параметры объявления (список <dl> / <table> с характеристиками)
    params = {}
    for row in soup.select(".attrs tr, .params tr, .attr, .c .t, dl, .attr-item"):
        cells = row.select("td, dd, dt, span, div")
        if len(cells) >= 2:
            key = cells[0].get_text(strip=True).lower()
            val = cells[1].get_text(strip=True)
            if key:
                params[key] = val

    page_text = soup.get_text(" ", strip=True)

    # Комнаты
    rooms_val = (
        params.get("комнат") or params.get("rooms") or params.get("սենյակ")
        or params.get("սենյակների") or ""
    )
    m = re.search(r"\d+", rooms_val)
    if m:
        data["rooms"] = int(m.group())
    else:
        for pattern in (
            r"(\d+)\s*(?:սենյակ|room|комн|комнат)",
            r"(\d+)[\s\-]*(?:room|комн)",
            r"(\d+)\s*k\b",
        ):
            tm = re.search(pattern, data.get("title") or "", re.I)
            if tm:
                data["rooms"] = int(tm.group(1))
                break

    # Этаж
    floor_val = params.get("этаж") or params.get("floor") or params.get("հարկ") or ""
    fm = re.search(r"(\d+)\s*/\s*(\d+)", floor_val)
    if fm:
        data["floor"] = int(fm.group(1))
        data["total_floors"] = int(fm.group(2))
    else:
        fm2 = re.search(r"\d+", floor_val)
        if fm2:
            data["floor"] = int(fm2.group())
        else:
            ffm = re.search(r"(\d+)\s*/\s*(\d+)\s*(?:հարկ|floor|эт)", page_text, re.I)
            if ffm:
                data["floor"] = int(ffm.group(1))
                data["total_floors"] = int(ffm.group(2))

    # Площадь
    area_val = (
        params.get("общая площадь") or params.get("площадь") or params.get("area")
        or params.get("մակերես") or ""
    )
    am = re.search(r"[\d.]+", area_val)
    if am:
        data["area_sqm"] = float(am.group())
    else:
        am2 = re.search(r"([\d.]+)\s*(?:ք\.?\s*մ|кв\.?\s*м|m²|sqm)", page_text, re.I)
        if am2:
            data["area_sqm"] = float(am2.group(1))

    # Адрес и район
    addr_tag = soup.select_one(".loc") or soup.select_one("[class*='loc']") or soup.select_one("[class*='addr']")
    data["address_raw"] = addr_tag.get_text(strip=True) if addr_tag else None
    data["district"] = extract_district(
        " ".join(filter(None, [data.get("address_raw"), data.get("title"), page_text[:2000]]))
    )

    # Описание
    desc_tag = soup.select_one(".body") or soup.select_one("[class*='desc']")
    data["description"] = desc_tag.get_text(strip=True) if desc_tag else None

    # Имя продавца
    name_tag = soup.select_one(".username") or soup.select_one("[class*='uname']")
    data["poster_name"] = name_tag.get_text(strip=True) if name_tag else None

    # Фотографии (s.list.am / img.list.am)
    data["photo_urls"] = extract_photo_urls(soup, html)

    # Определяем агента или собственника
    data["is_agency"] = is_agency_poster(
        data.get("poster_name", ""),
        data.get("description", "")
    )

    data["deal_type"] = infer_deal_type(
        data.get("price_usd"),
        deal_type,
        data.get("title") or "",
        data.get("description") or "",
    )

    return data


# ─── Парсинг страницы-списка объявлений ──────────────────────
def parse_listing_list_page(html: str, base_url: str) -> list[str]:
    """Возвращает список URL объявлений с одной страницы каталога."""
    soup = BeautifulSoup(html, "lxml")
    links = []
    for a in soup.select("a.vip, a[class*='item'], .gl a, .hl a"):
        href = a.get("href")
        if href and "/item/" in href:
            full_url = urljoin(base_url, href)
            if full_url not in links:
                links.append(full_url)
    return links


# ─── Основной класс парсера ───────────────────────────────────
class ListAmScraper:
    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self.curl_session = None

    async def __aenter__(self):
        if HAS_CURL:
            self.curl_session = CurlAsyncSession()
        else:
            self.client = httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=True,
                headers=get_headers(),
            )
        return self

    async def __aexit__(self, *args):
        if self.client:
            await self.client.aclose()
        if self.curl_session:
            await self.curl_session.close()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def fetch(self, url: str, referer: str | None = None) -> str:
        """Загружает страницу (curl_cffi обходит Cloudflare лучше httpx)."""
        ref = referer or url
        if HAS_CURL and self.curl_session:
            response = await self.curl_session.get(
                url,
                impersonate="chrome124",
                headers=get_headers(referer=ref),
                timeout=30,
            )
            response.raise_for_status()
            return response.text
        response = await self.client.get(url, headers=get_headers(referer=ref))
        response.raise_for_status()
        return response.text

    async def fetch_phone(self, item_url: str) -> dict:
        """
        Достаёт реальный контакт продавца через диалог /rtam.
        item_url — полный URL объявления (/item/<id>).
        Возвращает dict от parse_phone_dialog (phone может быть None).
        """
        item_id = item_id_from_url(item_url)
        if not item_id:
            return parse_phone_dialog("")
        rtam_url = f"https://www.list.am/rtam?i={item_id}&_rtt=1"
        try:
            html = await self.fetch(rtam_url, referer=item_url)
        except Exception as e:
            logger.warning(f"  ✗ phone {item_id}: {e}")
            return parse_phone_dialog("")
        return parse_phone_dialog(html)

    async def scrape_category(
        self,
        target: dict,
        max_pages: int = None,
        on_listing_found=None,
        known_check=None,
        stop_after_known: int | None = None,
    ) -> list[dict]:
        """
        Прогон по одной категории.

        on_listing_found — callback(data) для сохранения "на лету".
        known_check      — async callable(url) -> bool: объявление уже в базе.
        stop_after_known — сколько подряд «уже известных» встретить, чтобы
                           остановиться (delta-режим: лента отсортирована
                           новыми вперёд, значит дальше только старое).
        """
        max_pages = max_pages or settings.parser_max_pages
        all_listings = []
        base_url = target["base_url"]
        location_id = target.get("location_id")
        query_suffix = f"?n={location_id}" if location_id else ""

        consecutive_known = 0
        skipped_known = 0
        skipped_no_photo = 0

        logger.info(
            f"[{target['name']}] Начинаем парсинг. Макс страниц: {max_pages}"
            + (f", стоп после {stop_after_known} известных" if stop_after_known else "")
        )

        for page in range(1, max_pages + 1):
            path = base_url if page == 1 else f"{base_url}/{page}"
            page_url = f"{path}{query_suffix}"

            try:
                html = await self.fetch(page_url)
            except Exception as e:
                logger.error(f"Страница {page_url}: ошибка загрузки — {e}")
                break

            listing_urls = parse_listing_list_page(html, base_url)

            if not listing_urls:
                logger.info(f"Страница {page}: объявлений не найдено — стоп.")
                break

            logger.info(f"Страница {page}: найдено {len(listing_urls)} объявлений")

            reached_known_wall = False
            for listing_url in listing_urls:
                # Delta: пропускаем уже известные объявления без дорогой загрузки
                if known_check is not None:
                    try:
                        if await known_check(listing_url):
                            consecutive_known += 1
                            skipped_known += 1
                            if stop_after_known and consecutive_known >= stop_after_known:
                                logger.info(
                                    f"[{target['name']}] {consecutive_known} известных подряд "
                                    f"— достигли собранного, стоп."
                                )
                                reached_known_wall = True
                                break
                            continue
                    except Exception as e:  # noqa: BLE001
                        logger.warning(f"  ! known_check {listing_url}: {e}")
                consecutive_known = 0

                await asyncio.sleep(settings.parser_delay_seconds)

                try:
                    listing_html = await self.fetch(listing_url)
                    data = parse_listing_page(
                        listing_html,
                        listing_url,
                        target["deal_type"],
                        target["property_type"],
                    )

                    # Ingest guard: объявления без реального фото не берём вовсе
                    if settings.parser_require_photo and not has_real_photo(data.get("photo_urls")):
                        skipped_no_photo += 1
                        logger.debug(f"  ⨯ без фото, пропуск: {listing_url}")
                        continue

                    # Реальный контакт продавца (диалог /rtam)
                    if settings.parser_fetch_phones:
                        await asyncio.sleep(settings.parser_delay_seconds)
                        phone_info = await self.fetch_phone(listing_url)
                        if phone_info.get("phone"):
                            data["poster_phone"] = phone_info["phone"]
                        if phone_info.get("poster_name"):
                            data["poster_name"] = phone_info["poster_name"]
                            data["is_agency"] = is_agency_poster(
                                data.get("poster_name", ""),
                                data.get("description", ""),
                            )
                        data["poster_user_id"] = phone_info.get("poster_user_id")

                    all_listings.append(data)

                    if on_listing_found:
                        await on_listing_found(data)

                    logger.debug(f"  ✓ {listing_url} | {data.get('rooms')}к | ${data.get('price_usd')}")

                except Exception as e:
                    logger.warning(f"  ✗ {listing_url}: {e}")

            if reached_known_wall:
                break

            # Задержка между страницами
            await asyncio.sleep(settings.parser_delay_seconds * 2)

        logger.info(
            f"[{target['name']}] Готово: {len(all_listings)} новых "
            f"(известных пропущено: {skipped_known}, без фото: {skipped_no_photo})"
        )
        return all_listings
