import asyncio
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bs4 import BeautifulSoup

from photos import extract_photo_urls
from scraper import ListAmScraper, parse_listing_page


async def main():
    url = "https://www.list.am/item/23963163"
    async with ListAmScraper() as s:
        html = await s.fetch(url)
    data = parse_listing_page(html, url, "rent", "apartment")
    print("parse_listing_page photos:", len(data.get("photo_urls") or []))
    for p in (data.get("photo_urls") or [])[:5]:
        print(" ", p)


if __name__ == "__main__":
    asyncio.run(main())
