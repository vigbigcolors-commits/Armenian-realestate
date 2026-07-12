"""
SmartEstate Armenia — Telegram Bot для риелторов (Pro-агентов)
Мгновенные уведомления о новых объявлениях от собственников.
"""
import asyncio
import json
import os
import re
from html import escape
from typing import Any

import httpx
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from loguru import logger

from api_client import api
from url_utils import is_telegram_web_url
from alert_matcher import should_notify_agent
from keyboards import (
    main_menu,
    language_keyboard,
    filters_menu,
    filter_deal_keyboard,
    filter_district_keyboard,
    filter_rooms_keyboard,
    filter_price_keyboard,
    pro_menu,
    listing_alert_keyboard,
)
from i18n import (
    translate,
    get_user_locale,
    set_user_locale,
    LOCALE_NAMES,
    DEFAULT_LOCALE,
    Locale,
)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3001").rstrip("/")

bot: Bot | None = None
dp = Dispatcher()

# Черновик фильтра при пошаговом мастере
filter_drafts: dict[int, dict[str, Any]] = {}

YEREVAN_DISTRICTS_TOP = [
    "Арабкир", "Центр", "Аван", "Нор Норк", "Канакер-Зейтун",
    "Аджапняк", "Давидашен", "Еребуни", "Малатия-Себастия", "Шенгавит",
]


async def loc(user_id: int) -> Locale:
    return await get_user_locale(user_id)


def esc(value: Any) -> str:
    return escape(str(value if value is not None else "—"))


def format_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 11 and digits.startswith("374"):
        return f"+{digits[:3]} {digits[3:5]} {digits[5:8]} {digits[8:]}"
    return phone or "—"


def deal_label(deal: str | None, locale: Locale) -> str:
    if deal == "sale":
        return translate("deal_sale_label", locale)
    return translate("deal_rent_label", locale)


def status_label(agent: dict, locale: Locale) -> str:
    return translate("status_pro", locale) if agent.get("is_pro_active") else translate("status_free", locale)


def format_filter_summary(filt: dict, locale: Locale) -> str:
    deal = deal_label(filt.get("deal_type"), locale)
    district = filt.get("district") or translate("any_label", locale)
    rooms = filt.get("rooms") or translate("any_label", locale)
    price = filt.get("price_max_usd") or "∞"
    return translate(
        "filter_item", locale,
        deal=deal, district=district, rooms=rooms, price=price,
    )


def format_filters_list(agent: dict, locale: Locale) -> str:
    filters = agent.get("lead_filters") or []
    if not filters:
        return translate("filters_empty", locale)
    lines = [format_filter_summary(f, locale) for f in filters]
    return translate("filters_list", locale, list="\n".join(lines))


def format_status_card(agent: dict, locale: Locale) -> str:
    expires = agent.get("plan_expires_at")
    if expires:
        expires = expires[:10]
    else:
        expires = translate("expires_never", locale)

    mode = agent.get("notify_mode") or "all"
    notify_label = (
        translate("notify_mode_filtered", locale)
        if mode == "filtered"
        else translate("notify_mode_all", locale)
    )
    plan = translate("plan_pro", locale) if agent.get("is_pro_active") else translate("plan_free", locale)

    return translate(
        "status_card", locale,
        name=esc(agent.get("display_name") or "—"),
        plan=plan,
        expires=expires,
        notify_mode=notify_label,
        filters_count=agent.get("lead_filters_count", 0),
    )


async def register_and_get(user: types.User) -> dict | None:
    try:
        return await api.register_agent(
            telegram_id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
        )
    except httpx.HTTPError as e:
        logger.warning(f"register failed {user.id}: {e}")
        return None


async def send_home(message: types.Message, locale: Locale, agent: dict | None = None):
    if agent is None:
        agent = await register_and_get(message.from_user)
    if not agent:
        await message.answer(translate("api_error", locale), parse_mode="HTML")
        return

    status = status_label(agent, locale)
    try:
        await message.answer(
            translate("welcome", locale, status=status),
            parse_mode="HTML",
            reply_markup=main_menu(locale, agent.get("is_pro_active", False), SITE_URL),
        )
    except Exception as e:
        logger.error(f"send_home failed: {e}")
        await message.answer(
            translate("welcome", locale, status=status),
            parse_mode="HTML",
        )


@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    locale = await loc(message.from_user.id)
    agent = await register_and_get(message.from_user)
    if not agent:
        await message.answer(translate("api_error", locale), parse_mode="HTML")
        return

    args = (message.text or "").split(maxsplit=1)
    payload = args[1].strip().lower() if len(args) > 1 else ""

    if payload in ("pro", "pay", "subscribe"):
        await send_pro_info(message, locale, agent)
        return

    await send_home(message, locale, agent)


@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    locale = await loc(message.from_user.id)
    is_pro = False
    try:
        agent = await api.get_agent(message.from_user.id)
        is_pro = agent.get("is_pro_active", False)
    except httpx.HTTPError:
        pass
    await message.answer(
        translate("help_text", locale, site=SITE_URL),
        parse_mode="HTML",
        reply_markup=main_menu(locale, is_pro, SITE_URL),
    )


@dp.message(Command("status"))
async def cmd_status(message: types.Message):
    await show_status(message)


@dp.message(Command("pro"))
async def cmd_pro(message: types.Message):
    locale = await loc(message.from_user.id)
    try:
        agent = await api.get_agent(message.from_user.id)
    except httpx.HTTPError:
        await message.answer(translate("not_registered", locale))
        return
    await send_pro_info(message, locale, agent)


@dp.message(Command("filters"))
async def cmd_filters(message: types.Message):
    await show_filters(message)


async def show_status(message: types.Message):
    locale = await loc(message.from_user.id)
    try:
        agent = await api.get_agent(message.from_user.id)
    except httpx.HTTPError:
        await message.answer(translate("not_registered", locale))
        return
    await message.answer(
        format_status_card(agent, locale),
        parse_mode="HTML",
        reply_markup=main_menu(locale, agent.get("is_pro_active", False), SITE_URL),
    )


async def show_filters(message: types.Message):
    locale = await loc(message.from_user.id)
    try:
        agent = await api.get_agent(message.from_user.id)
    except httpx.HTTPError:
        await message.answer(translate("not_registered", locale))
        return

    text = translate("filters_title", locale) + "\n\n" + format_filters_list(agent, locale)
    await message.answer(
        text,
        parse_mode="HTML",
        reply_markup=filters_menu(locale, bool(agent.get("lead_filters"))),
    )


async def send_pro_info(message: types.Message, locale: Locale, agent: dict):
    await message.answer(
        translate("pro_info", locale, site=SITE_URL),
        parse_mode="HTML",
        reply_markup=pro_menu(locale, agent.get("is_pro_active", False)),
    )


@dp.callback_query(F.data == "menu_home")
async def cb_home(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    await send_home(callback.message, locale)
    await callback.answer()


@dp.callback_query(F.data == "menu_status")
async def cb_status(callback: types.CallbackQuery):
    await show_status(callback.message)
    await callback.answer()


@dp.callback_query(F.data == "menu_filters")
async def cb_filters(callback: types.CallbackQuery):
    await show_filters(callback.message)
    await callback.answer()


@dp.callback_query(F.data == "menu_pro_room")
async def cb_pro_room(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    await callback.message.answer(
        translate("pro_room_link", locale, url=f"{SITE_URL}/pro"),
        parse_mode="HTML",
    )
    await callback.answer()


@dp.callback_query(F.data == "menu_help")
async def cb_help(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    await callback.message.answer(
        translate("help_text", locale, site=SITE_URL),
        parse_mode="HTML",
    )
    await callback.answer()


@dp.callback_query(F.data == "menu_pro")
async def cb_pro(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    try:
        agent = await api.get_agent(callback.from_user.id)
    except httpx.HTTPError:
        await callback.answer(translate("api_error", locale), show_alert=True)
        return
    await send_pro_info(callback.message, locale, agent)
    await callback.answer()


@dp.callback_query(F.data == "language")
async def cb_language(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    await callback.message.answer(
        translate("language_pick", locale),
        reply_markup=language_keyboard(),
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("lang_"))
async def cb_set_language(callback: types.CallbackQuery):
    code = callback.data.split("_")[1]
    if code not in ("hy", "ru", "en"):
        await callback.answer()
        return
    await set_user_locale(callback.from_user.id, code)  # type: ignore
    locale = code  # type: ignore
    agent = await register_and_get(callback.from_user)
    await callback.message.answer(
        translate("language_set", locale) + f" — {LOCALE_NAMES[locale]}",
        reply_markup=main_menu(
            locale,
            bool(agent and agent.get("is_pro_active")),
            SITE_URL,
        ),
    )
    await callback.answer()


@dp.callback_query(F.data == "pay_pro")
async def cb_pay_pro(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    try:
        agent = await api.get_agent(callback.from_user.id)
        if agent.get("is_pro_active"):
            await callback.message.answer(translate("pro_already", locale), parse_mode="HTML")
            await callback.answer()
            return
        await api.subscribe_pro(callback.from_user.id)
        await callback.message.answer(translate("pro_activated", locale), parse_mode="HTML")
        agent = await api.get_agent(callback.from_user.id)
        await callback.message.answer(
            format_status_card(agent, locale),
            parse_mode="HTML",
            reply_markup=main_menu(locale, True, SITE_URL),
        )
    except httpx.HTTPError:
        await callback.message.answer(translate("api_error", locale))
    await callback.answer()


@dp.callback_query(F.data == "notify_all")
async def cb_notify_all(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    try:
        await api.set_notify_mode(callback.from_user.id, "all")
        await callback.message.answer(translate("notify_mode_set_all", locale), parse_mode="HTML")
    except httpx.HTTPError:
        await callback.message.answer(translate("api_error", locale))
    await callback.answer()


@dp.callback_query(F.data == "notify_filtered")
async def cb_notify_filtered(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    try:
        agent = await api.get_agent(callback.from_user.id)
        if not agent.get("lead_filters"):
            await callback.answer(translate("filters_empty", locale), show_alert=True)
            return
        await api.set_notify_mode(callback.from_user.id, "filtered")
        await callback.message.answer(translate("notify_mode_set_filtered", locale), parse_mode="HTML")
    except httpx.HTTPError:
        await callback.message.answer(translate("api_error", locale))
    await callback.answer()


@dp.callback_query(F.data == "filter_clear")
async def cb_filter_clear(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    try:
        await api.clear_lead_filters(callback.from_user.id)
        await callback.message.answer(translate("filters_cleared", locale), parse_mode="HTML")
        await show_filters(callback.message)
    except httpx.HTTPError:
        await callback.message.answer(translate("api_error", locale))
    await callback.answer()


@dp.callback_query(F.data == "filter_add")
async def cb_filter_add(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    filter_drafts[callback.from_user.id] = {}
    await callback.message.answer(
        translate("filter_deal_prompt", locale),
        reply_markup=filter_deal_keyboard(locale),
    )
    await callback.answer()


@dp.callback_query(F.data.in_({"filter_deal_rent", "filter_deal_sale"}))
async def cb_filter_deal(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    draft = filter_drafts.setdefault(callback.from_user.id, {})
    draft["deal_type"] = "rent" if callback.data == "filter_deal_rent" else "sale"

    districts = YEREVAN_DISTRICTS_TOP
    try:
        all_d = await api.list_districts()
        if all_d:
            districts = all_d[:14]
    except httpx.HTTPError:
        pass

    await callback.message.answer(
        translate("filter_district_prompt", locale),
        reply_markup=filter_district_keyboard(locale, districts),
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("filter_dist_"))
async def cb_filter_district(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    draft = filter_drafts.setdefault(callback.from_user.id, {})
    raw = callback.data.removeprefix("filter_dist_")
    draft["district"] = None if raw == "any" else raw

    await callback.message.answer(
        translate("filter_rooms_prompt", locale),
        reply_markup=filter_rooms_keyboard(locale),
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("filter_rooms_"))
async def cb_filter_rooms(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    draft = filter_drafts.setdefault(callback.from_user.id, {})
    raw = callback.data.removeprefix("filter_rooms_")
    draft["rooms"] = None if raw == "any" else int(raw)

    await callback.message.answer(
        translate("filter_price_prompt", locale),
        reply_markup=filter_price_keyboard(locale),
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("filter_price_"))
async def cb_filter_price(callback: types.CallbackQuery):
    locale = await loc(callback.from_user.id)
    draft = filter_drafts.setdefault(callback.from_user.id, {})
    raw = callback.data.removeprefix("filter_price_")
    draft["price_max_usd"] = None if raw == "any" else int(raw)

    payload = {
        "telegram_id": callback.from_user.id,
        "deal_type": draft.get("deal_type", "rent"),
        "district": draft.get("district"),
        "rooms": draft.get("rooms"),
        "price_max_usd": draft.get("price_max_usd"),
    }
    filter_drafts.pop(callback.from_user.id, None)

    try:
        await api.add_lead_filter(payload)
        summary = format_filter_summary(payload, locale)
        await callback.message.answer(
            translate("filter_saved", locale, summary=summary),
            parse_mode="HTML",
        )
        await show_filters(callback.message)
    except httpx.HTTPError:
        await callback.message.answer(translate("api_error", locale))
    await callback.answer()


def parse_text_filter(text: str) -> dict | None:
    low = text.lower()
    if not re.search(r"(?i)(лид|lead|լիդ|фильтр|filter|ֆիլտր)", low):
        return None

    deal_type = "sale" if any(w in low for w in ("продаж", "sale", "վաճառ")) else "rent"

    rooms_match = re.search(r"(\d)\s*(?:սենյակ|комнат|к\b|room)", low)
    rooms = int(rooms_match.group(1)) if rooms_match else None

    price_match = re.search(r"(?:մինչև|до|up to)\s*\$?\s*(\d[\d\s]*)", low)
    price_max = int(re.sub(r"\s", "", price_match.group(1))) if price_match else None

    districts_map = {
        "արաբկիր": "Арабкир", "арабкир": "Арабкир", "arabkir": "Арабкир",
        "կենտրոն": "Центр", "центр": "Центр", "center": "Центр",
        "ավան": "Аван", "аван": "Аван",
        "նոր նորք": "Нор Норк", "нор норк": "Нор Норк",
        "կանակեր": "Канакер-Зейтун", "канакер": "Канакер-Зейтун",
        "շենգավիթ": "Шенгавит", "шенгавит": "Шенгавит",
    }
    district = None
    for key, val in districts_map.items():
        if key in low:
            district = val
            break

    return {
        "deal_type": deal_type,
        "district": district,
        "rooms": rooms,
        "price_max_usd": price_max,
    }


@dp.message(F.text & ~F.text.startswith("/"))
async def handle_text(message: types.Message):
    locale = await loc(message.from_user.id)
    parsed = parse_text_filter(message.text or "")
    if not parsed:
        await message.answer(
            translate("help_text", locale, site=SITE_URL),
            parse_mode="HTML",
        )
        return

    payload = {"telegram_id": message.from_user.id, **parsed}
    try:
        await api.add_lead_filter(payload)
        summary = format_filter_summary(parsed, locale)
        await message.answer(
            translate("filter_saved", locale, summary=summary),
            parse_mode="HTML",
            reply_markup=filters_menu(locale, True),
        )
    except httpx.HTTPError:
        await message.answer(translate("api_error", locale))


def build_alert_text(data: dict, locale: Locale) -> str:
    from i18n.content import content

    ptype_key = f"ptype_{data.get('property_type') or 'apartment'}"
    ptype = content.get(ptype_key, {}).get(locale, data.get("property_type", "—"))
    deal = deal_label(data.get("deal_type"), locale)
    per_m = translate("per_month", locale) if data.get("deal_type") == "rent" else ""
    price = data.get("price_usd", "?")
    if isinstance(price, int):
        price = f"{price:,}"

    text = translate(
        "new_listing_alert", locale,
        title=esc(data.get("title", "—")),
        ptype=esc(ptype),
        deal=esc(deal),
        district=esc(data.get("district", "—")),
        rooms=esc(data.get("rooms", "?")),
        area=esc(data.get("area_sqm", "?")),
        floor=esc(data.get("floor", "?")),
        price=price,
        per_month=per_m,
        contact_name=esc(data.get("contact_name", "—")),
        contact_phone=esc(format_phone(data.get("contact_phone", ""))),
    )
    pid = data.get("property_id", "")
    listing_url = f"{SITE_URL}/property/{pid}"
    if pid and not is_telegram_web_url(listing_url):
        text += "\n\n" + translate("listing_url_local", locale, url=listing_url)
    return text


async def notify_pro_users():
    """Слушает Redis и шлёт Pro-агентам уведомления о новых объявлениях от собственников."""
    import redis.asyncio as aioredis

    while True:
        try:
            r = aioredis.from_url(REDIS_URL, decode_responses=True)
            pubsub = r.pubsub()
            await pubsub.subscribe("new_owner_listing")
            logger.info("Realtor bot: listening on new_owner_listing")

            async for msg in pubsub.listen():
                if msg["type"] != "message":
                    continue
                try:
                    data = json.loads(msg["data"])
                    agents = await api.list_pro_agents()
                    sent = 0
                    for agent in agents:
                        if not should_notify_agent(agent, data):
                            continue
                        tid = int(agent["telegram_id"])
                        locale = await get_user_locale(tid)
                        text = build_alert_text(data, locale)
                        kb = listing_alert_keyboard(
                            locale,
                            data.get("property_id", ""),
                            data.get("contact_phone", ""),
                            SITE_URL,
                        )
                        try:
                            await bot.send_message(tid, text, parse_mode="HTML", reply_markup=kb)
                            sent += 1
                        except Exception as e:
                            logger.warning(f"Alert failed for {tid}: {e}")
                    logger.info(
                        "Owner listing alert: {pid} → {sent}/{total} agents",
                        pid=data.get("property_id"),
                        sent=sent,
                        total=len(agents),
                    )
                except Exception as e:
                    logger.error(f"Notification handling error: {e}")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Redis listener crashed: {e}")
            await asyncio.sleep(5)


async def main():
    global bot

    if not BOT_TOKEN or BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        logger.warning("TELEGRAM_BOT_TOKEN не задан — бот в режиме ожидания")
        while True:
            await asyncio.sleep(3600)
        return

    bot = Bot(token=BOT_TOKEN)
    logger.info(f"SmartEstate Realtor Bot started (default locale: {DEFAULT_LOCALE})")

    asyncio.create_task(notify_pro_users())
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
