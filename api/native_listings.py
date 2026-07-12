"""
Нативная публикация объявлений на SmartEstate (без list.am).
"""
import hashlib
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api", tags=["native"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
MAX_PHOTO_BYTES = 8 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
AMD_TO_USD = int(os.getenv("AMD_TO_USD_RATE", "390"))
SALE_MIN_USD = 12_000
RENT_MAX_USD = 15_000

NATIVE_FEED_CLAUSES = [
    "p.source_origin = 'native'",
    "p.moderation_status = 'approved'",
]


def is_valid_photo_url(url: str) -> bool:
    if not url or "/r/" in url:
        return False
    if "/uploads/" in url or url.startswith("/uploads"):
        return True
    return "/f/" in url


def filter_display_photo_urls(urls: list | None) -> list | None:
    if not urls:
        return urls
    out = [u for u in urls if u and is_valid_photo_url(u)]
    return out or None


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("374"):
        return digits
    if digits.startswith("0") and len(digits) >= 9:
        return "374" + digits[1:]
    if len(digits) == 8:
        return "374" + digits
    return digits


class ListingSubmit(BaseModel):
    deal_type: Literal["sale", "rent"]
    property_type: Literal["apartment", "house", "commercial", "land"] = "apartment"
    district: str = Field(..., min_length=2, max_length=100)
    street: Optional[str] = Field(None, max_length=200)
    rooms: Optional[int] = Field(None, ge=1, le=20)
    floor: Optional[int] = Field(None, ge=-2, le=60)
    total_floors: Optional[int] = Field(None, ge=1, le=60)
    area_sqm: Optional[float] = Field(None, gt=0, le=50_000)
    price_amd: int = Field(..., gt=0)
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=8000)
    contact_name: str = Field(..., min_length=2, max_length=200)
    contact_phone: Optional[str] = Field(None, max_length=30)
    contact_email: Optional[str] = Field(None, max_length=200)
    hide_phone: bool = False
    photo_urls: list[str] = Field(..., min_length=1, max_length=15)

    @model_validator(mode="after")
    def validate_contact(self) -> "ListingSubmit":
        if self.hide_phone:
            if not (self.contact_email or "").strip():
                raise ValueError("Укажите email, если телефон скрыт")
        elif not self.contact_phone or len(normalize_phone(self.contact_phone)) < 11:
            raise ValueError("Укажите корректный номер телефона")
        return self

    @field_validator("photo_urls")
    @classmethod
    def validate_photos(cls, urls: list[str]) -> list[str]:
        clean = [u.strip() for u in urls if u and is_valid_photo_url(u.strip())]
        if not clean:
            raise ValueError("Нужно хотя бы одно загруженное фото")
        return clean


def make_fingerprint(data: ListingSubmit) -> str:
    identity = (
        normalize_phone(data.contact_phone or "")
        if data.contact_phone
        else (data.contact_email or "").lower().strip()
    )
    raw = (
        f"{identity}|{data.district.lower()}|"
        f"{data.rooms or 0}|{data.area_sqm or 0}|{data.deal_type}"
    )
    return hashlib.sha256(raw.encode()).hexdigest()[:64]


@router.post("/uploads/photo")
async def upload_photo(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Допустимы только JPEG, PNG, WebP")

    data = await file.read()
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(400, "Файл больше 8 МБ")

    ext = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(file.content_type or "", ".jpg")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"/uploads/{name}", "filename": name}


async def create_native_listing(
    body: ListingSubmit,
    db: AsyncSession,
    poster_user_id: Optional[str] = None,
) -> dict:
    phone = normalize_phone(body.contact_phone or "") if body.contact_phone else ""
    email = (body.contact_email or "").strip().lower() or None

    if not body.hide_phone and len(phone) < 11:
        raise HTTPException(400, "Укажите корректный номер телефона")
    if body.hide_phone and not email:
        raise HTTPException(400, "Укажите email для связи")

    price_usd = max(1, body.price_amd // AMD_TO_USD)
    if body.deal_type == "sale" and price_usd < SALE_MIN_USD:
        raise HTTPException(
            400,
            f"Минимальная цена продажи — около {SALE_MIN_USD * AMD_TO_USD:,} ֏",
        )
    if body.deal_type == "rent" and price_usd > RENT_MAX_USD:
        raise HTTPException(
            400,
            f"Максимальная цена аренды — около {RENT_MAX_USD * AMD_TO_USD:,} ֏/мес",
        )

    fp = make_fingerprint(body)
    existing = await db.execute(
        text(
            "SELECT id FROM properties WHERE fingerprint = :fp "
            "AND source_origin = 'native' AND status = 'active' LIMIT 1"
        ),
        {"fp": fp},
    )
    if existing.scalar():
        raise HTTPException(409, "Похожее объявление уже опубликовано")

    prop_id = str(uuid.uuid4())
    listing_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    source_url = f"https://smartestate.am/listing/{prop_id}"

    await db.execute(
        text("""
            INSERT INTO properties (
                id, property_type, deal_type, district, street, rooms, floor,
                total_floors, area_sqm, current_price_usd, owner_price_usd,
                is_owner_verified, owner_phone, photo_urls, title, description_raw,
                fingerprint, status, duplicate_count, source_origin, moderation_status,
                contact_name, contact_phone, contact_email, hide_phone, poster_user_id,
                created_at, updated_at
            ) VALUES (
                :id, :property_type, :deal_type, :district, :street, :rooms, :floor,
                :total_floors, :area_sqm, :price_usd, :price_usd,
                TRUE, :phone, :photo_urls, :title, :description,
                :fp, 'active', 0, 'native', 'approved',
                :contact_name, :phone, :email, :hide_phone, :poster_user_id,
                :now, :now
            )
        """),
        {
            "id": prop_id,
            "property_type": body.property_type,
            "deal_type": body.deal_type,
            "district": body.district.strip(),
            "street": (body.street or "").strip() or None,
            "rooms": body.rooms,
            "floor": body.floor,
            "total_floors": body.total_floors,
            "area_sqm": body.area_sqm,
            "price_usd": price_usd,
            "phone": phone or None,
            "photo_urls": body.photo_urls,
            "title": body.title.strip(),
            "description": body.description.strip(),
            "fp": fp,
            "contact_name": body.contact_name.strip(),
            "email": email,
            "hide_phone": body.hide_phone,
            "poster_user_id": poster_user_id,
            "now": now,
        },
    )

    await db.execute(
        text("""
            INSERT INTO listings (
                id, property_id, source_site, source_url, external_id,
                title, description, price_amd, price_usd, currency,
                poster_phone, poster_name, is_agency, rooms, floor,
                total_floors, area_sqm, district, address_raw, photo_urls,
                dedup_status, is_active, scraped_at, updated_at
            ) VALUES (
                :lid, :pid, 'smartestate', :source_url, :external_id,
                :title, :description, :price_amd, :price_usd, 'AMD',
                :phone, :contact_name, FALSE, :rooms, :floor,
                :total_floors, :area_sqm, :district, :street, :photo_urls,
                'original', TRUE, :now, :now
            )
        """),
        {
            "lid": listing_id,
            "pid": prop_id,
            "external_id": listing_id,
            "source_url": source_url,
            "title": body.title.strip(),
            "description": body.description.strip(),
            "price_amd": body.price_amd,
            "price_usd": price_usd,
            "phone": phone,
            "contact_name": body.contact_name.strip(),
            "rooms": body.rooms,
            "floor": body.floor,
            "total_floors": body.total_floors,
            "area_sqm": body.area_sqm,
            "district": body.district.strip(),
            "street": (body.street or body.district).strip(),
            "photo_urls": body.photo_urls,
            "now": now,
        },
    )

    await db.execute(
        text("""
            INSERT INTO price_history (property_id, listing_id, price_usd, price_amd, source_site, note)
            VALUES (:pid, :lid, :price_usd, :price_amd, 'smartestate', 'Публикация на платформе')
        """),
        {
            "pid": prop_id,
            "lid": listing_id,
            "price_usd": price_usd,
            "price_amd": body.price_amd,
        },
    )

    return {
        "id": prop_id,
        "status": "approved",
        "message": "Объявление опубликовано",
        "url": f"/property/{prop_id}",
    }
