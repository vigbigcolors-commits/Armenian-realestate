"""Seller registration, login, cabinet (listings + favorites)."""
import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from typing import Callable, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PBKDF2_ROUNDS = 100_000


class SellerRegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)


class SellerLoginBody(BaseModel):
    email: EmailStr
    password: str


class FavoriteBody(BaseModel):
    property_id: str


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ROUNDS)
    return f"pbkdf2${salt}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    if not stored or not stored.startswith("pbkdf2$"):
        return False
    try:
        _, salt, hexhash = stored.split("$", 2)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ROUNDS)
        return digest.hex() == hexhash
    except ValueError:
        return False


def create_seller_router(get_db: Callable) -> APIRouter:
    router = APIRouter(prefix="/api/sellers", tags=["sellers"])

    async def _resolve_user(
        authorization: Optional[str],
        db: AsyncSession,
    ) -> dict:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        token = authorization.removeprefix("Bearer ").strip()
        row = await db.execute(
            text("""
                SELECT u.id, u.email, u.display_name, u.phone, u.role, u.plan
                FROM user_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token = :tok AND s.expires_at > NOW()
            """),
            {"tok": token},
        )
        user = row.mappings().first()
        if not user:
            raise HTTPException(status_code=401, detail="Session expired")
        return dict(user)

    def _user_payload(user: dict, token: str) -> dict:
        return {
            "token": token,
            "user": {
                "id": str(user["id"]),
                "name": user.get("display_name") or user.get("email") or "Seller",
                "email": user.get("email"),
                "phone": user.get("phone"),
                "role": user.get("role"),
            },
        }

    @router.post("/register")
    async def register(body: SellerRegisterBody, db: AsyncSession = Depends(get_db)):
        existing = await db.execute(
            text("SELECT id FROM users WHERE LOWER(email) = LOWER(:email)"),
            {"email": body.email},
        )
        if existing.first():
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = str(uuid.uuid4())
        token = secrets.token_urlsafe(32)
        await db.execute(
            text("""
                INSERT INTO users (id, email, phone, display_name, role, plan, password_hash)
                VALUES (:id, :email, :phone, :name, 'owner', 'free', :ph)
            """),
            {
                "id": user_id,
                "email": body.email.lower(),
                "phone": body.phone,
                "name": body.name.strip(),
                "ph": _hash_password(body.password),
            },
        )
        await db.execute(
            text("""
                INSERT INTO user_sessions (user_id, token, expires_at)
                VALUES (:uid, :tok, NOW() + INTERVAL '90 days')
            """),
            {"uid": user_id, "tok": token},
        )
        await db.commit()
        return _user_payload(
            {"id": user_id, "email": body.email, "display_name": body.name, "phone": body.phone, "role": "owner"},
            token,
        )

    @router.post("/login")
    async def login(body: SellerLoginBody, db: AsyncSession = Depends(get_db)):
        row = await db.execute(
            text("""
                SELECT id, email, display_name, phone, role, plan, password_hash
                FROM users WHERE LOWER(email) = LOWER(:email)
            """),
            {"email": body.email},
        )
        user = row.mappings().first()
        if not user or not user.get("password_hash"):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not _verify_password(body.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = secrets.token_urlsafe(32)
        await db.execute(
            text("""
                INSERT INTO user_sessions (user_id, token, expires_at)
                VALUES (:uid, :tok, NOW() + INTERVAL '90 days')
            """),
            {"uid": user["id"], "tok": token},
        )
        await db.commit()
        return _user_payload(dict(user), token)

    @router.get("/me")
    async def me(
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ):
        user = await _resolve_user(authorization, db)
        listings = await db.execute(
            text("""
                SELECT COUNT(*) FROM properties
                WHERE poster_user_id = :uid AND source_origin = 'native'
            """),
            {"uid": user["id"]},
        )
        favs = await db.execute(
            text("SELECT COUNT(*) FROM user_favorites WHERE user_id = :uid"),
            {"uid": user["id"]},
        )
        return {
            "id": str(user["id"]),
            "name": user.get("display_name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": user.get("role"),
            "listings_count": listings.scalar() or 0,
            "favorites_count": favs.scalar() or 0,
        }

    @router.get("/my-listings")
    async def my_listings(
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ):
        user = await _resolve_user(authorization, db)
        result = await db.execute(
            text("""
                SELECT id, title, district, deal_type, current_price_usd,
                       rooms, photo_urls, status, moderation_status, created_at
                FROM properties
                WHERE poster_user_id = :uid AND source_origin = 'native'
                ORDER BY created_at DESC
            """),
            {"uid": user["id"]},
        )
        items = []
        for row in result.mappings():
            d = dict(row)
            d["id"] = str(d["id"])
            if d.get("created_at"):
                d["created_at"] = d["created_at"].isoformat()
            items.append(d)
        return items

    @router.get("/favorites")
    async def list_favorites(
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ):
        user = await _resolve_user(authorization, db)
        result = await db.execute(
            text("""
                SELECT p.id, p.title, p.district, p.deal_type, p.current_price_usd,
                       p.rooms, p.photo_urls, p.status
                FROM user_favorites f
                JOIN properties p ON p.id = f.property_id
                WHERE f.user_id = :uid AND p.status = 'active'
                ORDER BY f.created_at DESC
            """),
            {"uid": user["id"]},
        )
        items = []
        for row in result.mappings():
            d = dict(row)
            d["id"] = str(d["id"])
            items.append(d)
        return items

    @router.post("/favorites")
    async def add_favorite(
        body: FavoriteBody,
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ):
        user = await _resolve_user(authorization, db)
        prop = await db.execute(
            text("SELECT id FROM properties WHERE id = :pid AND status = 'active'"),
            {"pid": body.property_id},
        )
        if not prop.first():
            raise HTTPException(status_code=404, detail="Property not found")
        await db.execute(
            text("""
                INSERT INTO user_favorites (user_id, property_id)
                VALUES (:uid, :pid)
                ON CONFLICT DO NOTHING
            """),
            {"uid": user["id"], "pid": body.property_id},
        )
        await db.commit()
        return {"status": "added"}

    @router.delete("/favorites/{property_id}")
    async def remove_favorite(
        property_id: str,
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ):
        user = await _resolve_user(authorization, db)
        await db.execute(
            text("DELETE FROM user_favorites WHERE user_id = :uid AND property_id = :pid"),
            {"uid": user["id"], "pid": property_id},
        )
        await db.commit()
        return {"status": "removed"}

    return router
