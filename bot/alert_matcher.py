"""Match new owner listings against agent lead filters."""
from typing import Any


def listing_matches_filter(listing: dict[str, Any], filt: dict[str, Any]) -> bool:
    if filt.get("deal_type") and listing.get("deal_type") != filt["deal_type"]:
        return False

    district = filt.get("district")
    if district and (listing.get("district") or "").lower() != district.lower():
        return False

    rooms = filt.get("rooms")
    if rooms is not None and listing.get("rooms") != rooms:
        return False

    price_max = filt.get("price_max_usd")
    if price_max is not None:
        price = listing.get("price_usd") or 0
        if price > price_max:
            return False

    return True


def should_notify_agent(agent: dict[str, Any], listing: dict[str, Any]) -> bool:
    mode = agent.get("notify_mode") or "all"
    filters = agent.get("filters") or []

    if mode == "all" or not filters:
        return True

    return any(listing_matches_filter(listing, f) for f in filters)
