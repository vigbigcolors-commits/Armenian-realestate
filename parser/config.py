from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database
    database_url: str = Field(..., env="DATABASE_URL")

    # Redis
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")

    # Parser behavior
    parser_delay_seconds: float = Field(3.0, env="PARSER_DELAY_SECONDS")
    parser_max_pages: int = Field(50, env="PARSER_MAX_PAGES")
    parser_interval_minutes: int = Field(180, env="PARSER_INTERVAL_MINUTES")
    parser_fetch_phones: bool = Field(True, env="PARSER_FETCH_PHONES")

    # Delta-режим: собираем только свежее и останавливаемся, дойдя до уже
    # известных объявлений (лента отсортирована новыми вперёд).
    parser_delta_mode: bool = Field(True, env="PARSER_DELTA_MODE")
    parser_delta_max_pages: int = Field(4, env="PARSER_DELTA_MAX_PAGES")
    parser_delta_stop_known: int = Field(20, env="PARSER_DELTA_STOP_KNOWN")

    # Ingest guard: не сохраняем объявления без реального фото (/f/).
    parser_require_photo: bool = Field(True, env="PARSER_REQUIRE_PHOTO")

    # AI (Gemini — бесплатный tier, или OpenAI как fallback)
    ai_provider: str = Field("gemini", env="AI_PROVIDER")
    gemini_api_key: str = Field("", env="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-2.0-flash", env="GEMINI_MODEL")
    openai_api_key: str = Field("", env="OPENAI_API_KEY")

    # Telegram
    telegram_bot_token: str = Field("", env="TELEGRAM_BOT_TOKEN")

    # USD conversion fallback (обновляется раз в день)
    amd_to_usd_rate: float = 390.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ─── Целевые URL на List.am ───────────────────────────────────
# Категория 56 = Квартиры продажа, 60 = Квартиры аренда
# Аренда первая — чтобы не ждать полного прогона продажи (50+ страниц)
LISTAM_TARGETS = [
    {
        "name": "list_am_apartments_rent",
        "base_url": "https://www.list.am/category/60",
        "deal_type": "rent",
        "property_type": "apartment",
    },
    {
        "name": "list_am_apartments_sale",
        "base_url": "https://www.list.am/category/56",
        "deal_type": "sale",
        "property_type": "apartment",
    },
    {
        "name": "list_am_houses_sale",
        "base_url": "https://www.list.am/category/63",
        "deal_type": "sale",
        "property_type": "house",
    },
]

# ─── ID локаций на List.am (?n=<id>) ──────────────────────────
# Родительские ID марзов (кроме Еревана) — покрывают все города региона.
# Категории list.am: 62 = «Վաճառք» (продажа, все типы),
#                    63 = «Երկարաժամկետ վարձակալություն» (аренда, все типы).
REGION_LOCATION_IDS = {
    "Армавир": 23, "Арарат": 19, "Котайк": 40, "Ширак": 49, "Лори": 44,
    "Гегаркуник": 35, "Сюник": 52, "Арагацотн": 14, "Тавуш": 57, "Вайоц Дзор": 61,
}

# ID отдельных городов (для точечного дозапроса и сопоставления)
CITY_LOCATION_IDS = {
    "Армавир": 24, "Эчмиадзин": 25, "Метсамор": 26,
    "Арташат": 21, "Масис": 22, "Арарат": 20, "Веди": 86,
    "Абовян": 41, "Раздан": 42, "Цахкадзор": 43, "Чаренцаван": 66, "Егвард": 67,
    "Гюмри": 51, "Артик": 50,
    "Ванадзор": 48, "Алаверди": 45, "Спитак": 46, "Степанаван": 47,
    "Гавар": 36, "Мартуни": 37, "Севан": 38, "Варденис": 39,
    "Горис": 53, "Капан": 54, "Мегри": 55, "Сисиан": 56, "Каджаран": 74,
    "Апаран": 15, "Аштарак": 17, "Талин": 18,
    "Берд": 59, "Дилижан": 58, "Иджеван": 60, "Ноемберян": 68,
    "Джермук": 65, "Вайк": 62, "Ехегнадзор": 63,
}

REGION_TARGETS = []
for _region, _nid in REGION_LOCATION_IDS.items():
    REGION_TARGETS.append({
        "name": f"region_{_region}_rent",
        "base_url": "https://www.list.am/category/63",
        "deal_type": "rent",
        "property_type": "apartment",
        "location_id": _nid,
    })
    REGION_TARGETS.append({
        "name": f"region_{_region}_sale",
        "base_url": "https://www.list.am/category/62",
        "deal_type": "sale",
        "property_type": "apartment",
        "location_id": _nid,
    })

# ─── Локации Армении: каноничное имя → варианты написания ──────
# Каноничное имя всегда на русском — под него фильтрует API/UI.
LOCATION_ALIASES = {
    # ── Ереван (районы) ──
    "Центр": ["центр", "кентрон", "kentron", "center", "centre", "կենտրոն"],
    "Арабкир": ["арабкир", "arabkir", "արաբկիր"],
    "Аван": ["аван", "avan", "ավան"],
    "Нор Норк": ["нор норк", "nor nork", "նոր նորք"],
    "Канакер-Зейтун": ["канакер", "зейтун", "kanaker", "zeytun", "քանաքեռ"],
    "Аджапняк": ["аджапняк", "ajapnyak", "աջափնյակ"],
    "Давидашен": ["давидашен", "давташен", "davtashen", "դավթաշեն"],
    "Еребуни": ["еребуни", "erebuni", "էրեբունի"],
    "Малатия-Себастия": ["малатия", "себастия", "malatia", "sebastia", "մալաթիա"],
    "Шенгавит": ["шенгавит", "shengavit", "շենգավիթ"],
    "Норк-Мараш": ["норк-мараш", "норк мараш", "nork marash", "նորք"],
    "Нубарашен": ["нубарашен", "nubarashen", "նուբարաշեն"],
    # ── Котайк ──
    "Абовян": ["абовян", "abovyan", "աբովյան"],
    "Раздан": ["раздан", "hrazdan", "հրազդան"],
    "Цахкадзор": ["цахкадзор", "tsaghkadzor", "ծաղկաձոր"],
    "Чаренцаван": ["чаренцаван", "charentsavan", "չարենցավան"],
    "Егвард": ["егвард", "yeghvard", "եղվարդ"],
    # ── Ширак ──
    "Гюмри": ["гюмри", "gyumri", "գյումրի"],
    "Артик": ["артик", "artik", "արթիկ"],
    # ── Лори ──
    "Ванадзор": ["ванадзор", "vanadzor", "վանաձոր"],
    "Степанаван": ["степанаван", "stepanavan", "ստեփանավան"],
    "Алаверди": ["алаверди", "alaverdi", "ալավերդի"],
    "Спитак": ["спитак", "spitak", "սպիտակ"],
    # ── Тавуш ──
    "Дилижан": ["дилижан", "dilijan", "դիլիջան"],
    "Иджеван": ["иджеван", "ijevan", "իջևան"],
    "Берд": ["берд", "berd", "բերդ"],
    "Ноемберян": ["ноемберян", "noyemberyan", "նոյեմբերյան"],
    # ── Гегаркуник ──
    "Севан": ["севан", "sevan", "սևան"],
    "Гавар": ["гавар", "gavar", "գավառ"],
    "Мартуни": ["мартуни", "martuni", "մարտունի"],
    "Варденис": ["варденис", "vardenis", "վարդենիս"],
    # ── Армавир ──
    "Армавир": ["армавир", "armavir", "արմավիր"],
    "Эчмиадзин": ["эчмиадзин", "вагаршапат", "ejmiatsin", "vagharshapat", "էջմիածին"],
    "Метсамор": ["метсамор", "мецамор", "metsamor", "մեծամոր"],
    # ── Арарат ──
    "Арташат": ["арташат", "artashat", "արտաշատ"],
    "Масис": ["масис", "masis", "մասիս"],
    "Арарат": ["арарат", "ararat", "արարատ"],
    "Веди": ["веди", "vedi", "վեդի"],
    # ── Арагацотн ──
    "Аштарак": ["аштарак", "ashtarak", "աշտարակ"],
    "Апаран": ["апаран", "aparan", "ապարան"],
    "Талин": ["талин", "talin", "թալին"],
    # ── Вайоц Дзор ──
    "Джермук": ["джермук", "jermuk", "ջերմուկ"],
    "Ехегнадзор": ["ехегнадзор", "yeghegnadzor", "եղեգնաձոր"],
    "Вайк": ["вайк", "vayk", "վայք"],
    # ── Сюник ──
    "Капан": ["капан", "kapan", "կապան"],
    "Горис": ["горис", "goris", "գորիս"],
    "Сисиан": ["сисиан", "sisian", "սիսիան"],
    "Мегри": ["мегри", "meghri", "մեղրի"],
    "Каджаран": ["каджаран", "kajaran", "քաջարան"],
}

# Плоский индекс: любой вариант (lower) → каноничное имя
_LOCATION_LOOKUP = {}
for _canon, _aliases in LOCATION_ALIASES.items():
    _LOCATION_LOOKUP[_canon.lower()] = _canon
    for _a in _aliases:
        _LOCATION_LOOKUP[_a.lower()] = _canon

# Совместимость со старым кодом
YEREVAN_DISTRICTS = list(LOCATION_ALIASES.keys())
