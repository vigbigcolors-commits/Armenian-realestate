"""
Умный разбор поискового запроса.

Стратегия:
1. Быстрый детерминированный парсер (typo-устойчивый, склонения, синонимы).
2. Опциональный слой Gemini — если задан GEMINI_API_KEY — для понимания
   совсем вольных/неграмотных формулировок. Всегда есть фолбэк.

Возвращаемая структура (QueryIntent):
  deal_type, rooms, district, price_min, price_max, property_type, sort, keywords
"""
import os
import re
import json
import asyncio
import difflib
from typing import Any, Optional

from loguru import logger

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").strip()

# Стоп-слова, которые не несут смысла для полнотекстового поиска
STOPWORDS = {
    "ищу", "хочу", "нужен", "нужна", "нужно", "куплю", "снять", "снимаю",
    "продажа", "продать", "аренда", "аренду", "арендовать", "сдать", "сдается",
    "квартира", "квартиру", "квартиры", "дом", "дома", "домик",
    "в", "на", "с", "по", "до", "от", "за", "и", "или", "для", "около", "возле",
    "рядом", "недалеко", "комнат", "комнатная", "комнатную", "комнаты",
    "am", "list", "недвижимость", "куплю", "сниму", "ищем",
    "the", "a", "in", "for", "with", "near", "apartment", "house", "flat",
    "rent", "sale", "buy", "want", "looking",
}


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower().strip())


def _parse_amount(raw: str) -> Optional[int]:
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


def build_deterministic_intent(
    q: str,
    location_lookup: dict[str, str],
    landmark_map: dict[str, str],
) -> dict[str, Any]:
    """Правила + fuzzy. Никогда не падает."""
    text = _norm(q)
    intent: dict[str, Any] = {
        "deal_type": None, "rooms": None, "district": None,
        "price_min": None, "price_max": None, "property_type": None,
        "sort": None, "keywords": [],
    }
    if not text:
        return intent

    # ── Тип сделки ──
    if any(w in text for w in ("аренд", "снять", "снима", "сдаёт", "сдает", "сдаёи", "rent", "վարձ")):
        intent["deal_type"] = "rent"
    elif any(w in text for w in ("продаж", "купить", "куплю", "покупк", "sale", "buy", "վաճառ", "գնել")):
        intent["deal_type"] = "sale"

    # ── Тип недвижимости ──
    if any(w in text for w in ("дом", "коттедж", "особняк", "house", "villa", "cottage", "տուն", "առանձնատ")):
        intent["property_type"] = "house"
    elif any(w in text for w in ("квартир", "апартам", "apartment", "flat", "բնակարան", "студи", "studio")):
        intent["property_type"] = "apartment"

    # ── Комнаты ──
    rm = re.search(r"(\d)\s*(?:комнат|-комн|\s*к\b|комн|room|սեն)", text)
    if rm:
        intent["rooms"] = int(rm.group(1))
    elif any(w in text for w in ("студи", "studio", "однушк", "1-комн", "одноком")):
        intent["rooms"] = 1
    elif any(w in text for w in ("двушк", "2-комн", "двухком")):
        intent["rooms"] = 2
    elif any(w in text for w in ("трёшк", "трешк", "3-комн", "трёхком", "трехком")):
        intent["rooms"] = 3

    # ── Цена ──
    mx = re.search(r"(?:до|дешевле|не дороже|под|максимум|max|up to|<)\s*\$?֏?\s*([\d.,\s]+\s*(?:млн|миллион|тыс|k|к)?)", text)
    if mx:
        amt = _parse_amount(mx.group(1))
        if amt:
            intent["price_max"] = amt
    mn = re.search(r"(?:от|дороже|начиная|минимум|min|from|>)\s*\$?֏?\s*([\d.,\s]+\s*(?:млн|миллион|тыс|k|к)?)", text)
    if mn:
        amt = _parse_amount(mn.group(1))
        if amt:
            intent["price_min"] = amt

    # ── Локация: Ереван (весь город) → точное вхождение → ориентир → fuzzy ──
    matched = None
    yerevan_wide = False
    if re.search(r"\bере[в|б]ан|\byerevan|երևան|эривань", text):
        # «в Ереване» без района = весь город: район не фиксируем,
        # но помечаем, чтобы fuzzy не притянул случайный город.
        yerevan_wide = True
    if not yerevan_wide:
        for alias in sorted(location_lookup.keys(), key=len, reverse=True):
            if re.search(rf"\b{re.escape(alias)}", text):
                matched = location_lookup[alias]
                break
    if not matched and not yerevan_wide:
        for lm, dist in landmark_map.items():
            if lm in text:
                matched = dist
                break
    if not matched and not yerevan_wide:
        # fuzzy: слово запроса vs алиасы (опечатки/склонения); строгий порог
        tokens = re.findall(r"[а-яёa-zա-ֆ]{5,}", text)
        alias_keys = list(location_lookup.keys())
        best = None
        best_score = 0.0
        for tok in tokens:
            if tok in STOPWORDS:
                continue
            for cand in difflib.get_close_matches(tok, alias_keys, n=1, cutoff=0.84):
                score = difflib.SequenceMatcher(None, tok, cand).ratio()
                # длины должны быть сопоставимы — иначе «ереване» цепляет «севане»
                if score > best_score and abs(len(tok) - len(cand)) <= 2:
                    best_score = score
                    best = location_lookup[cand]
        if best:
            matched = best
    if matched:
        intent["district"] = matched

    # ── Намерение сортировки ──
    if any(w in text for w in ("ниже рыночн", "ниже рынка", "недооцен", "выгодн", "хорошая сделка", "лучшая цена")):
        intent["sort"] = "deal"
    elif any(w in text for w in ("дешев", "дешёв", "самые низк", "самая низк", "низкая цен", "низкие цен", "дешевле", "подешевле", "недорог", "бюджет", "доступн", "cheap", "affordable")):
        intent["sort"] = "price_asc"
    elif any(w in text for w in ("дорог", "премиум", "элитн", "люкс", "expensive", "luxury")):
        intent["sort"] = "price_desc"
    elif any(w in text for w in ("новые", "свежие", "недавн", "последн", "new", "latest")):
        intent["sort"] = "recent"

    # ── Ключевые слова (для полнотекста): всё осмысленное, кроме стоп-слов и чисел ──
    kws = []
    for tok in re.findall(r"[а-яёa-zա-ֆ]{4,}", text):
        if tok in STOPWORDS:
            continue
        # пропускаем то, что уже стало локацией
        if intent["district"] and tok in intent["district"].lower():
            continue
        kws.append(tok)
    intent["keywords"] = kws[:6]

    return intent


def _gemini_parse_sync(q: str, districts: list[str]) -> Optional[dict]:
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    district_list = ", ".join(districts)
    prompt = f"""You parse Armenian real-estate search queries. The user may write in
Russian, Armenian or English, with typos, slang or bad grammar. Understand the INTENT.

Return ONLY valid JSON with these keys (use null when unknown):
{{
  "deal_type": "rent" | "sale" | null,
  "property_type": "apartment" | "house" | null,
  "rooms": integer | null,
  "price_min": integer | null,   // USD
  "price_max": integer | null,   // USD
  "district": one of [{district_list}] or null,   // pick the closest real location
  "sort": "price_asc" | "price_desc" | "deal" | "recent" | null,
  "keywords": [up to 5 meaningful words, no stopwords]
}}

Rules:
- "ниже рыночного"/"выгодно" => sort="deal"; "самые дешёвые"/"недорого" => "price_asc";
  "премиум"/"дорого" => "price_desc"; "новые"/"свежие" => "recent".
- "дом/коттедж/տուն/house" => property_type="house"; "квартира/студия/apartment" => "apartment".
- Map misspelled or declined place names to the closest option in the list
  (e.g. "степанаване"->"Степанаван", "дилижане"->"Дилижан", "гюмри"->"Гюмри").
- Prices: convert "1.5 млн"->1500000, "40 тыс"->40000.

QUERY: {q}
"""
    resp = model.generate_content(prompt)
    raw = (resp.text or "").strip()
    raw = re.sub(r"^```json\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
    data = json.loads(raw)
    if not isinstance(data, dict):
        return None
    return data


async def understand_query(
    q: str,
    location_lookup: dict[str, str],
    landmark_map: dict[str, str],
    districts: list[str],
) -> dict[str, Any]:
    """
    Главная точка: объединяет детерминированный парсер и Gemini.
    Детерминированный — базовый (быстрый, всегда есть). Gemini — уточняет
    поля, которые правила не смогли извлечь.
    """
    base = build_deterministic_intent(q, location_lookup, landmark_map)

    # Gemini зовём только когда правила ничего толком не поняли —
    # это экономит квоту и держит обычные запросы мгновенными.
    understood = any(
        base.get(k) is not None
        for k in ("deal_type", "district", "rooms", "price_min", "price_max", "property_type", "sort")
    )
    use_gemini = bool(GEMINI_API_KEY) and AI_PROVIDER == "gemini" and not understood
    if use_gemini:
        try:
            gem = await asyncio.wait_for(
                asyncio.to_thread(_gemini_parse_sync, q, districts),
                timeout=6.0,
            )
            if gem:
                # Gemini дополняет пропуски; валидируем district по списку
                merged = dict(base)
                for key in ("deal_type", "property_type", "rooms", "price_min", "price_max", "sort"):
                    if merged.get(key) is None and gem.get(key) is not None:
                        merged[key] = gem[key]
                if not merged.get("district") and gem.get("district") in districts:
                    merged["district"] = gem["district"]
                if not merged.get("keywords") and isinstance(gem.get("keywords"), list):
                    merged["keywords"] = [str(k) for k in gem["keywords"]][:6]
                merged["_ai"] = True
                return merged
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Gemini query parse failed, using rules: {e}")

    base["_ai"] = False
    return base
