"""Inline keyboards for the realtor bot."""
from aiogram.utils.keyboard import InlineKeyboardBuilder

from i18n import translate, LOCALE_NAMES, Locale
from url_utils import is_telegram_web_url


def main_menu(locale: Locale, is_pro: bool, site_url: str):
    b = InlineKeyboardBuilder()
    b.button(text=translate("btn_filters", locale), callback_data="menu_filters")
    b.button(text=translate("btn_pro", locale), callback_data="menu_pro")
    b.button(text=translate("btn_status", locale), callback_data="menu_status")
    pro_room_url = f"{site_url}/pro"
    if is_telegram_web_url(pro_room_url):
        b.button(text=translate("btn_pro_room", locale), url=pro_room_url)
    else:
        b.button(text=translate("btn_pro_room", locale), callback_data="menu_pro_room")
    b.button(text=translate("btn_help", locale), callback_data="menu_help")
    b.button(text=translate("btn_language", locale), callback_data="language")
    if is_pro:
        b.button(text=translate("btn_notify_all", locale), callback_data="notify_all")
        b.button(text=translate("btn_notify_filtered", locale), callback_data="notify_filtered")
    b.adjust(1)
    return b.as_markup()


def language_keyboard():
    b = InlineKeyboardBuilder()
    for code, label in LOCALE_NAMES.items():
        b.button(text=label, callback_data=f"lang_{code}")
    b.adjust(1)
    return b.as_markup()


def filters_menu(locale: Locale, has_filters: bool):
    b = InlineKeyboardBuilder()
    b.button(text=translate("btn_add_filter", locale), callback_data="filter_add")
    if has_filters:
        b.button(text=translate("btn_clear_filters", locale), callback_data="filter_clear")
    b.button(text=translate("btn_back", locale), callback_data="menu_home")
    b.adjust(1)
    return b.as_markup()


def filter_deal_keyboard(locale: Locale):
    b = InlineKeyboardBuilder()
    b.button(text=translate("deal_rent", locale), callback_data="filter_deal_rent")
    b.button(text=translate("deal_sale", locale), callback_data="filter_deal_sale")
    b.button(text=translate("btn_back", locale), callback_data="menu_filters")
    b.adjust(2, 1)
    return b.as_markup()


def filter_district_keyboard(locale: Locale, districts: list[str]):
    b = InlineKeyboardBuilder()
    b.button(text=translate("district_any", locale), callback_data="filter_dist_any")
    for d in districts[:14]:
        b.button(text=d, callback_data=f"filter_dist_{d[:40]}")
    b.button(text=translate("btn_back", locale), callback_data="filter_add")
    b.adjust(2)
    return b.as_markup()


def filter_rooms_keyboard(locale: Locale):
    b = InlineKeyboardBuilder()
    b.button(text=translate("rooms_any", locale), callback_data="filter_rooms_any")
    for n in (1, 2, 3, 4, 5):
        b.button(text=str(n), callback_data=f"filter_rooms_{n}")
    b.button(text=translate("btn_back", locale), callback_data="filter_add")
    b.adjust(3, 3, 1)
    return b.as_markup()


def filter_price_keyboard(locale: Locale):
    b = InlineKeyboardBuilder()
    b.button(text=translate("price_any", locale), callback_data="filter_price_any")
    for p in (500, 800, 1000, 1500, 2000, 3000):
        b.button(text=f"${p}", callback_data=f"filter_price_{p}")
    b.button(text=translate("btn_back", locale), callback_data="filter_add")
    b.adjust(3, 3, 1)
    return b.as_markup()


def pro_menu(locale: Locale, is_pro: bool):
    b = InlineKeyboardBuilder()
    if not is_pro:
        b.button(text=translate("btn_pay_pro", locale), callback_data="pay_pro")
    b.button(text=translate("btn_back", locale), callback_data="menu_home")
    b.adjust(1)
    return b.as_markup()


def listing_alert_keyboard(locale: Locale, property_id: str, phone: str, site_url: str):
    b = InlineKeyboardBuilder()
    listing_url = f"{site_url}/property/{property_id}"
    has_buttons = False

    if is_telegram_web_url(listing_url):
        b.button(text=translate("btn_open_listing", locale), url=listing_url)
        has_buttons = True
    if phone:
        tel = phone if phone.startswith("+") else f"+{phone}"
        b.button(text=translate("btn_call_owner", locale), url=f"tel:{tel}")
        has_buttons = True

    if not has_buttons:
        return None
    b.adjust(1)
    return b.as_markup()
