"""

Извлечение URL фотографий с list.am (s.list.am / img.list.am).

Только фото галереи объявления (/f/), без похожих (/r/).

"""

import re

from typing import Optional

from urllib.parse import urljoin



from bs4 import BeautifulSoup



LISTAM_PHOTO_RE = re.compile(

    r"(?:https?:)?//(?:s\.list\.am|img\.list\.am)/f/\d+/\d+\.(?:jpg|jpeg|webp|png)",

    re.IGNORECASE,

)



# Галерея объявления в JS: po87.init('#po87', {img:["//s.list.am/f/..."]})

GALLERY_INIT_RE = re.compile(

    r"po\d+\.init\([^,]+,\s*\{img:\s*\[([^\]]+)\]",

    re.IGNORECASE,

)



SKIP_FRAGMENTS = (

    "/img/",

    "/r/",

    "avatar.list.am",

    "upa.list.am",

    "icons/",

    ".svg",

    "listcamp",

)





def normalize_listam_photo(src: str) -> Optional[str]:

    if not src:

        return None

    src = src.strip()

    lower = src.lower()

    if any(x in lower for x in SKIP_FRAGMENTS):

        return None



    if src.startswith("//"):

        src = "https:" + src

    elif src.startswith("/"):

        src = urljoin("https://www.list.am", src)



    if not re.search(r"(?:s\.list\.am|img\.list\.am)/f/\d+/\d+", src, re.I):

        return None



    src = src.split("?")[0]

    src = re.sub(r"\.webp$", ".jpg", src, flags=re.I)

    src = src.replace("img.list.am", "s.list.am")

    return src





def is_listing_photo(url: str) -> bool:

    """Только фото галереи объявления, не блок «похожие»."""

    return bool(url and "/f/" in url and "/r/" not in url)




def has_real_photo(urls: list[str] | None) -> bool:

    """True, если есть хотя бы одно настоящее фото галереи (/f/)."""

    return any(is_listing_photo(u) for u in (urls or []))





def filter_listing_photos(urls: list[str] | None) -> list[str]:

    seen: set[str] = set()

    out: list[str] = []

    for raw in urls or []:

        normalized = normalize_listam_photo(raw)

        if normalized and normalized not in seen:

            seen.add(normalized)

            out.append(normalized)

    return out





def extract_gallery_from_scripts(html: str) -> list[str]:

    urls: list[str] = []

    seen: set[str] = set()



    for match in GALLERY_INIT_RE.finditer(html or ""):

        chunk = match.group(1)

        for quoted in re.findall(r'"(//[^"]+)"|\'(//[^\']+)\'', chunk):

            raw = quoted[0] or quoted[1]

            normalized = normalize_listam_photo(raw)

            if normalized and normalized not in seen:

                seen.add(normalized)

                urls.append(normalized)



    return urls





def extract_photo_urls(soup: BeautifulSoup, html: str) -> list[str]:

    # 1) Точный список из галереи объявления (самый надёжный источник)

    script_urls = extract_gallery_from_scripts(html)

    if script_urls:

        return script_urls[:20]



    urls: list[str] = []

    seen: set[str] = set()



    def add(raw: Optional[str]) -> None:

        normalized = normalize_listam_photo(raw or "")

        if normalized and normalized not in seen:

            seen.add(normalized)

            urls.append(normalized)



    for match in LISTAM_PHOTO_RE.findall(html or ""):

        add(match)



    for img in soup.find_all("img"):

        for attr in ("src", "data-src", "data-lazy-src", "data-original"):

            add(img.get(attr))



        srcset = img.get("srcset")

        if srcset:

            for part in srcset.split(","):

                chunk = part.strip().split()

                if chunk:

                    add(chunk[0])



    for meta in soup.select('meta[property="og:image"], meta[name="twitter:image"]'):

        add(meta.get("content"))



    return urls[:20]


