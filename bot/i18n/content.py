"""
SmartEstate Armenia — Telegram Bot для риелторов (Pro-агентов)
Основной язык: hy
"""
from typing import Literal

Locale = Literal["hy", "ru", "en"]
PRIMARY_LOCALE: Locale = "hy"
DEFAULT_LOCALE: Locale = "hy"

LOCALE_NAMES = {
    "hy": "🇦🇲 Հայերեն",
    "ru": "🇷🇺 Русский",
    "en": "🇬🇧 English",
}


def tri(hy: str, ru: str, en: str) -> dict[Locale, str]:
    return {"hy": hy, "ru": ru, "en": en}


content = {
    "welcome": tri(
        "🏡 <b>SmartEstate Pro — բոտ риելտորների համար</b>\n\n"
        "Այս բոտը նախատեսված է միայն <b>գործակալների</b> համար։\n"
        "Երբ <b>սեփականատերը</b> հրապարակում է նոր օբյեկտ SmartEstate-ում, "
        "դուք Pro-ով ստանում եք push <b>վայրկյանների</b> ընթացքում։\n\n"
        "• Ուղիղ հեռախոս սեփականատիրոջ\n"
        "• Ֆիլտրեր Golden Lead-ի համար\n"
        "• Առանց կրկնօրինակների և ֆեյկերի\n\n"
        "Կարգավիճակ՝ <b>{status}</b>",
        "🏡 <b>SmartEstate Pro — бот для риелторов</b>\n\n"
        "Этот бот только для <b>агентов</b>.\n"
        "Когда <b>собственник</b> публикует объект на SmartEstate, "
        "вы с Pro получаете push за <b>секунды</b>.\n\n"
        "• Прямой телефон собственника\n"
        "• Фильтры Golden Lead\n"
        "• Без дубликатов и фейков\n\n"
        "Статус: <b>{status}</b>",
        "🏡 <b>SmartEstate Pro — realtor bot</b>\n\n"
        "This bot is for <b>agents only</b>.\n"
        "When an <b>owner</b> posts on SmartEstate, "
        "Pro agents get a push within <b>seconds</b>.\n\n"
        "• Direct owner phone\n"
        "• Golden Lead filters\n"
        "• No duplicates or fakes\n\n"
        "Status: <b>{status}</b>",
    ),
    "status_pro": tri("⚡ Pro ակտիվ", "⚡ Pro активен", "⚡ Pro active"),
    "status_free": tri("Անվճար (առանց push)", "Бесплатно (без push)", "Free (no push)"),

    "btn_filters": tri("🎯 Լիդերի ֆիլտրեր", "🎯 Фильтры лидов", "🎯 Lead filters"),
    "btn_pro": tri("⚡ Pro բաժանորդագրություն", "⚡ Подписка Pro", "⚡ Pro subscription"),
    "btn_status": tri("📊 Իմ կարգավիճակը", "📊 Мой статус", "📊 My status"),
    "btn_pro_room": tri("🛠 Pro-սենյակ կայքում", "🛠 Pro-комната на сайте", "🛠 Pro room on site"),
    "pro_room_link": tri(
        "🛠 <b>Pro-սենյակ</b>\n\n{url}",
        "🛠 <b>Pro-комната</b>\n\n{url}",
        "🛠 <b>Pro room</b>\n\n{url}",
    ),
    "listing_url_local": tri(
        "🔗 <a href=\"{url}\">Բացել օբյեկտը</a>",
        "🔗 <a href=\"{url}\">Открыть объект</a>",
        "🔗 <a href=\"{url}\">Open listing</a>",
    ),
    "btn_help": tri("❓ Օգնություն", "❓ Помощь", "❓ Help"),
    "btn_language": tri("🌐 Լեզու", "🌐 Язык", "🌐 Language"),
    "btn_notify_all": tri("🔔 Բոլոր նոր օբյեկտները", "🔔 Все новые объекты", "🔔 All new listings"),
    "btn_notify_filtered": tri("🎯 Միայն ֆիլտրով", "🎯 Только по фильтрам", "🎯 Filtered only"),
    "btn_add_filter": tri("➕ Ավելացնել ֆիլտր", "➕ Добавить фильтр", "➕ Add filter"),
    "btn_clear_filters": tri("🗑 Մաքրել ֆիլտրերը", "🗑 Очистить фильтры", "🗑 Clear filters"),
    "btn_back": tri("← Ետ", "← Назад", "← Back"),
    "btn_pay_pro": tri("💳 Միանալ Pro — 9 000 ֏", "💳 Подключить Pro — 9 000 ֏", "💳 Get Pro — 9,000 ֏"),
    "btn_open_listing": tri("🔗 Բացել օբյեկտը", "🔗 Открыть объект", "🔗 Open listing"),
    "btn_call_owner": tri("📞 Զանգել սեփականատիրոջ", "📞 Позвонить собственнику", "📞 Call owner"),

    "deal_rent": tri("🏠 Վարձ", "🏠 Аренда", "🏠 Rent"),
    "deal_sale": tri("💰 Վաճառք", "💰 Продажа", "💰 Sale"),
    "district_any": tri("📍 Ցանկացած թաղամաս", "📍 Любой район", "📍 Any district"),
    "rooms_any": tri("Ցանկացած", "Любое", "Any"),
    "price_any": tri("Անսահմանափակ", "Без лимита", "No limit"),

    "pro_info": tri(
        "⚡ <b>SmartEstate Pro — 9 000 ֏ / ամիս</b>\n\n"
        "<b>Golden Lead</b> — push նոր սեփականատիրոջ օբյեկտի մասին վայրկյանների ընթացքում։\n"
        "Օգտատերերը տեսնում են 1 ժամ հետո։\n\n"
        "• Ուղիղ հեռախոս և անուն\n"
        "• Bargain Argument — գների վերլուծություն\n"
        "• Parasite Radar — գողացված լուսանկարներ\n"
        "• Pro-սենյակ՝ {site}/pro",
        "⚡ <b>SmartEstate Pro — 9 000 ֏ / месяц</b>\n\n"
        "<b>Golden Lead</b> — push о новом объекте от собственника за секунды.\n"
        "Обычные пользователи видят через 1 час.\n\n"
        "• Прямой телефон и имя владельца\n"
        "• Bargain Argument — отчёты по ценам\n"
        "• Parasite Radar — украденные фото\n"
        "• Pro-комната: {site}/pro",
        "⚡ <b>SmartEstate Pro — 9,000 AMD / month</b>\n\n"
        "<b>Golden Lead</b> — push on new owner listings in seconds.\n"
        "Regular users see them 1 hour later.\n\n"
        "• Direct owner phone and name\n"
        "• Bargain Argument — price reports\n"
        "• Parasite Radar — stolen photos\n"
        "• Pro room: {site}/pro",
    ),
    "pro_activated": tri(
        "✅ <b>Pro ակտիվ է 30 օրով</b>\n\n"
        "Այժմ դուք կստանաք push յուրաքանչյուր նոր սեփականատիրոջ հայտարարության մասին։\n"
        "Կարգավորեք ֆիլտրերը՝ Golden Lead-ի համար։",
        "✅ <b>Pro активен на 30 дней</b>\n\n"
        "Теперь вы получаете push о каждом новом объявлении от собственника.\n"
        "Настройте фильтры для Golden Lead.",
        "✅ <b>Pro active for 30 days</b>\n\n"
        "You now receive push alerts for every new owner listing.\n"
        "Set up filters for Golden Lead.",
    ),
    "pro_already": tri(
        "ℹ️ Pro արդեն ակտիվ է։",
        "ℹ️ Pro уже активен.",
        "ℹ️ Pro is already active.",
    ),

    "status_card": tri(
        "📊 <b>Ձեր պրոֆիլը</b>\n\n"
        "Անուն՝ {name}\n"
        "Պլան՝ <b>{plan}</b>\n"
        "Գործում է մինչև՝ {expires}\n"
        "Ծանուցումներ՝ <b>{notify_mode}</b>\n"
        "Ակտիվ ֆիլտրեր՝ <b>{filters_count}</b>",
        "📊 <b>Ваш профиль</b>\n\n"
        "Имя: {name}\n"
        "План: <b>{plan}</b>\n"
        "Действует до: {expires}\n"
        "Уведомления: <b>{notify_mode}</b>\n"
        "Активных фильтров: <b>{filters_count}</b>",
        "📊 <b>Your profile</b>\n\n"
        "Name: {name}\n"
        "Plan: <b>{plan}</b>\n"
        "Valid until: {expires}\n"
        "Notifications: <b>{notify_mode}</b>\n"
        "Active filters: <b>{filters_count}</b>",
    ),
    "notify_mode_all": tri("բոլոր օբյեկտները", "все объекты", "all listings"),
    "notify_mode_filtered": tri("միայն ֆիլտրով", "только по фильтрам", "filtered only"),
    "expires_never": tri("—", "—", "—"),
    "plan_pro": tri("Pro", "Pro", "Pro"),
    "plan_free": tri("Անվճար", "Бесплатно", "Free"),

    "filters_title": tri(
        "🎯 <b>Լիդերի ֆիլտրեր (Golden Lead)</b>\n\n"
        "Եթե ֆիլտր չկա — Pro-ով ստանում եք <b>բոլոր</b> նոր սեփականատիրոջ օբյեկտները։\n"
        "Ֆիլտր ավելացնելուց հետո կարող եք միացնել ռեժիմ «միայն ֆիլտրով»։\n\n"
        "Կամ գրեք տեքստով.\n"
        "<code>լիդ վարձ Արաբկիր 2 սենյակ մինչև 800</code>",
        "🎯 <b>Фильтры лидов (Golden Lead)</b>\n\n"
        "Без фильтров Pro получает <b>все</b> новые объекты от собственников.\n"
        "После добавления фильтров включите режим «только по фильтрам».\n\n"
        "Или текстом:\n"
        "<code>лид аренда Арабкир 2 комн до 800</code>",
        "🎯 <b>Lead filters (Golden Lead)</b>\n\n"
        "With no filters, Pro gets <b>all</b> new owner listings.\n"
        "After adding filters, switch to «filtered only» mode.\n\n"
        "Or send text:\n"
        "<code>lead rent Arabkir 2 rooms up to 800</code>",
    ),
    "filters_list": tri(
        "📋 <b>Ակտիվ ֆիլտրեր</b>\n\n{list}",
        "📋 <b>Активные фильтры</b>\n\n{list}",
        "📋 <b>Active filters</b>\n\n{list}",
    ),
    "filters_empty": tri(
        "Դեռ ֆիլտր չկա — ստանում եք բոլոր նոր օբյեկտները։",
        "Фильтров пока нет — приходят все новые объекты.",
        "No filters yet — you receive all new listings.",
    ),
    "filter_item": tri(
        "• {deal} · {district} · {rooms} սենյ. · մինչև ${price}",
        "• {deal} · {district} · {rooms} комн. · до ${price}",
        "• {deal} · {district} · {rooms} rm · up to ${price}",
    ),
    "filter_deal_prompt": tri(
        "Ընտրեք գործարքի տեսակը.",
        "Выберите тип сделки.",
        "Choose deal type.",
    ),
    "filter_district_prompt": tri(
        "Ընտրեք թաղամասը.",
        "Выберите район.",
        "Choose district.",
    ),
    "filter_rooms_prompt": tri(
        "Ընտրեք սենյակների քանակը.",
        "Выберите количество комнат.",
        "Choose number of rooms.",
    ),
    "filter_price_prompt": tri(
        "Ընտրեք առավելագույն գինը ($).",
        "Выберите максимальную цену ($).",
        "Choose max price ($).",
    ),
    "filter_saved": tri(
        "✅ Ֆիլտրը պահպանված է։\n{summary}",
        "✅ Фильтр сохранён.\n{summary}",
        "✅ Filter saved.\n{summary}",
    ),
    "filters_cleared": tri(
        "🗑 Ֆիլտրերը մաքրված են։ Կրկին ստանում եք բոլոր նոր օբյեկտները։",
        "🗑 Фильтры очищены. Снова приходят все новые объекты.",
        "🗑 Filters cleared. You receive all new listings again.",
    ),
    "notify_mode_set_all": tri(
        "🔔 Ծանուցումներ՝ <b>բոլոր</b> նոր սեփականատիրոջ օբյեկտների մասին։",
        "🔔 Уведомления: <b>все</b> новые объекты от собственников.",
        "🔔 Notifications: <b>all</b> new owner listings.",
    ),
    "notify_mode_set_filtered": tri(
        "🎯 Ծանուցումներ՝ <b>միայն ֆիլտրով</b> համապատասխանող օբյեկտների մասին։",
        "🎯 Уведомления: <b>только по фильтрам</b>.",
        "🎯 Notifications: <b>filtered only</b>.",
    ),

    "help_text": tri(
        "<b>Հրամաններ</b>\n"
        "/start — գլխավոր մենյու\n"
        "/filters — լիդերի ֆիլտրեր\n"
        "/pro — Pro բաժանորդագրություն\n"
        "/status — կարգավիճակ\n"
        "/help — օգնություն\n\n"
        "<b>Ֆիլտր տեքստով</b>\n"
        "<code>լիդ վարձ Արաբկիր 2 սենյակ մինչև 800</code>\n\n"
        "Սեփականատերերը հրապարակում են՝ {site}/post",
        "<b>Команды</b>\n"
        "/start — главное меню\n"
        "/filters — фильтры лидов\n"
        "/pro — подписка Pro\n"
        "/status — статус\n"
        "/help — помощь\n\n"
        "<b>Фильтр текстом</b>\n"
        "<code>лид аренда Арабкир 2 комн до 800</code>\n\n"
        "Собственники публикуют на {site}/post",
        "<b>Commands</b>\n"
        "/start — main menu\n"
        "/filters — lead filters\n"
        "/pro — Pro subscription\n"
        "/status — status\n"
        "/help — help\n\n"
        "<b>Text filter</b>\n"
        "<code>lead rent Arabkir 2 rooms up to 800</code>\n\n"
        "Owners post at {site}/post",
    ),

    "language_pick": tri(
        "Ընտրեք լեզուն.",
        "Выберите язык.",
        "Choose language.",
    ),
    "language_set": tri("✅ Լեզուն փոխված է", "✅ Язык изменён", "✅ Language changed"),

    "api_error": tri(
        "⚠️ Կապի սխալ։ Փորձեք ավելի ուշ։",
        "⚠️ Ошибка соединения. Попробуйте позже.",
        "⚠️ Connection error. Try again later.",
    ),
    "not_registered": tri(
        "Սեղմեք /start",
        "Нажмите /start",
        "Press /start",
    ),

    "new_listing_alert": tri(
        "⚡ <b>ՆՈՐ ԼԻԴ — սեփականատեր</b>\n\n"
        "<b>{title}</b>\n"
        "{ptype} · {deal} · {district}\n"
        "🏠 {rooms} սենյ. · 📐 {area} մ² · հարկ {floor}\n"
        "💰 <b>${price}{per_month}</b>\n\n"
        "👤 {contact_name}\n"
        "📞 <code>{contact_phone}</code>\n\n"
        "<i>Pro արտոնություն — դուք տեսնում եք ավելի վաղ</i>",
        "⚡ <b>НОВЫЙ ЛИД — собственник</b>\n\n"
        "<b>{title}</b>\n"
        "{ptype} · {deal} · {district}\n"
        "🏠 {rooms} комн. · 📐 {area} м² · этаж {floor}\n"
        "💰 <b>${price}{per_month}</b>\n\n"
        "👤 {contact_name}\n"
        "📞 <code>{contact_phone}</code>\n\n"
        "<i>Pro-привилегия — вы видите раньше рынка</i>",
        "⚡ <b>NEW LEAD — owner</b>\n\n"
        "<b>{title}</b>\n"
        "{ptype} · {deal} · {district}\n"
        "🏠 {rooms} rm · 📐 {area} m² · floor {floor}\n"
        "💰 <b>${price}{per_month}</b>\n\n"
        "👤 {contact_name}\n"
        "📞 <code>{contact_phone}</code>\n\n"
        "<i>Pro privilege — you see it before the market</i>",
    ),

    "ptype_apartment": tri("Բնակարան", "Квартира", "Apartment"),
    "ptype_house": tri("Տուն", "Дом", "House"),
    "ptype_commercial": tri("Կոմերցիոն", "Коммерческая", "Commercial"),
    "ptype_land": tri("Հողամաս", "Участок", "Land"),
    "deal_rent_label": tri("Վարձ", "Аренда", "Rent"),
    "deal_sale_label": tri("Վաճառք", "Продажа", "Sale"),
    "per_month": tri("/ամիս", "/мес", "/mo"),
    "any_label": tri("ցանկացած", "любой", "any"),
    "rooms_label": tri("սենյ.", "комн.", "rm"),
}


def translate(key: str, locale: Locale, **kwargs) -> str:
    text = content[key][locale]
    if kwargs:
        text = text.format(**kwargs)
    return text
