"""URL helpers — Telegram accepts only public http(s) links in inline buttons."""
from urllib.parse import urlparse


def is_telegram_web_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        host = (parsed.hostname or "").lower()
        if not host:
            return False
        if host in ("localhost", "127.0.0.1", "::1"):
            return False
        if host.endswith(".local"):
            return False
        return True
    except Exception:
        return False
