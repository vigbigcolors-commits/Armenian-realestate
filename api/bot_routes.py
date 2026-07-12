"""REST endpoints for the realtor Telegram bot."""
from datetime import datetime, timezone
from typing import Callable, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class BotRegisterBody(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class NotifyModeBody(BaseModel):
    notify_mode: Literal["all", "filtered"]


class LeadFilterBody(BaseModel):
    telegram_id: int
    deal_type: str = "rent"
    district: Optional[str] = None
    rooms: Optional[int] = Field(None, ge=1, le=20)
    price_max_usd: Optional[int] = Field(None, ge=1)


def _is_pro_active(row: dict) -> bool:
    if row.get("plan") != "pro":
        return False
    expires = row.get("plan_expires_at")
    if expires is None:
        return True
    if isinstance(expires, datetime):
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return expires > datetime.now(timezone.utc)
    return True


def create_bot_router(get_db: Callable) -> APIRouter:
    router = APIRouter(prefix="/api/bot", tags=["bot"])

    async def _agent_profile(db: AsyncSession, telegram_id: int) -> dict:
        row = await db.execute(
            text("""
                SELECT telegram_id, telegram_username, display_name, role, plan,
                       plan_expires_at, notify_mode, bot_started_at, agency_name, is_verified
                FROM users WHERE telegram_id = :tid
            """),
            {"tid": telegram_id},
        )
        user = row.mappings().first()
        if not user:
            raise HTTPException(status_code=404, detail="Agent not registered")

        alerts = await db.execute(
            text("""
                SELECT id, deal_type, district, rooms, price_max_usd, created_at
                FROM price_alerts
                WHERE telegram_id = :tid AND is_active = TRUE
                ORDER BY created_at DESC
            """),
            {"tid": telegram_id},
        )
        filters = [dict(a) for a in alerts.mappings().all()]
        data = dict(user)
        data["is_pro_active"] = _is_pro_active(data)
        data["lead_filters"] = filters
        data["lead_filters_count"] = len(filters)
        if data.get("plan_expires_at"):
            data["plan_expires_at"] = data["plan_expires_at"].isoformat()
        if data.get("bot_started_at"):
            data["bot_started_at"] = data["bot_started_at"].isoformat()
        for f in data["lead_filters"]:
            if f.get("created_at"):
                f["created_at"] = f["created_at"].isoformat()
            if f.get("id"):
                f["id"] = str(f["id"])
        return data

    @router.post("/register")
    async def register_agent(
        body: BotRegisterBody,
        db: AsyncSession = Depends(get_db),
    ):
        display = " ".join(
            p for p in (body.first_name, body.last_name) if p
        ).strip() or (body.username and f"@{body.username}") or "Agent"

        await db.execute(
            text("""
                INSERT INTO users (
                    telegram_id, role, plan, display_name, telegram_username,
                    notify_mode, bot_started_at
                )
                VALUES (:tid, 'agent', 'free', :name, :username, 'all', NOW())
                ON CONFLICT (telegram_id) DO UPDATE SET
                    telegram_username = COALESCE(EXCLUDED.telegram_username, users.telegram_username),
                    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
                    role = 'agent',
                    bot_started_at = COALESCE(users.bot_started_at, NOW())
            """),
            {
                "tid": body.telegram_id,
                "name": display[:200],
                "username": (body.username or "")[:100] or None,
            },
        )
        await db.commit()
        return await _agent_profile(db, body.telegram_id)

    @router.get("/agent/{telegram_id}")
    async def get_agent(telegram_id: int, db: AsyncSession = Depends(get_db)):
        return await _agent_profile(db, telegram_id)

    @router.patch("/agent/{telegram_id}/notify-mode")
    async def set_notify_mode(
        telegram_id: int,
        body: NotifyModeBody,
        db: AsyncSession = Depends(get_db),
    ):
        res = await db.execute(
            text("""
                UPDATE users SET notify_mode = :mode
                WHERE telegram_id = :tid
                RETURNING telegram_id
            """),
            {"tid": telegram_id, "mode": body.notify_mode},
        )
        if not res.first():
            raise HTTPException(status_code=404, detail="Agent not registered")
        await db.commit()
        return await _agent_profile(db, telegram_id)

    @router.post("/lead-filters")
    async def add_lead_filter(
        body: LeadFilterBody,
        db: AsyncSession = Depends(get_db),
    ):
        if body.deal_type not in ("rent", "sale"):
            raise HTTPException(status_code=400, detail="deal_type must be rent or sale")

        await db.execute(
            text("""
                INSERT INTO price_alerts (telegram_id, deal_type, district, rooms, price_max_usd)
                VALUES (:telegram_id, :deal_type, :district, :rooms, :price_max_usd)
                ON CONFLICT (telegram_id, deal_type, district, rooms, price_max_usd)
                DO UPDATE SET is_active = TRUE, updated_at = NOW()
            """),
            {
                "telegram_id": body.telegram_id,
                "deal_type": body.deal_type,
                "district": body.district,
                "rooms": body.rooms,
                "price_max_usd": body.price_max_usd,
            },
        )
        await db.execute(
            text("""
                UPDATE users SET notify_mode = 'filtered'
                WHERE telegram_id = :tid AND notify_mode = 'all'
            """),
            {"tid": body.telegram_id},
        )
        await db.commit()
        return await _agent_profile(db, body.telegram_id)

    @router.delete("/lead-filters/{alert_id}")
    async def delete_lead_filter(
        alert_id: str,
        telegram_id: int = Query(...),
        db: AsyncSession = Depends(get_db),
    ):
        await db.execute(
            text("""
                UPDATE price_alerts SET is_active = FALSE, updated_at = NOW()
                WHERE id = :id AND telegram_id = :tid
            """),
            {"id": alert_id, "tid": telegram_id},
        )
        await db.commit()
        return await _agent_profile(db, telegram_id)

    @router.delete("/lead-filters")
    async def clear_lead_filters(
        telegram_id: int = Query(...),
        db: AsyncSession = Depends(get_db),
    ):
        await db.execute(
            text("""
                UPDATE price_alerts SET is_active = FALSE, updated_at = NOW()
                WHERE telegram_id = :tid
            """),
            {"tid": telegram_id},
        )
        await db.execute(
            text("UPDATE users SET notify_mode = 'all' WHERE telegram_id = :tid"),
            {"tid": telegram_id},
        )
        await db.commit()
        return await _agent_profile(db, telegram_id)

    @router.get("/pro-agents")
    async def list_pro_agents(db: AsyncSession = Depends(get_db)):
        users = await db.execute(
            text("""
                SELECT telegram_id, notify_mode, plan_expires_at
                FROM users
                WHERE plan = 'pro' AND telegram_id IS NOT NULL
                  AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
            """)
        )
        agents = []
        for row in users.mappings():
            tid = row["telegram_id"]
            alerts = await db.execute(
                text("""
                    SELECT deal_type, district, rooms, price_max_usd
                    FROM price_alerts
                    WHERE telegram_id = :tid AND is_active = TRUE
                """),
                {"tid": tid},
            )
            agents.append({
                "telegram_id": tid,
                "notify_mode": row.get("notify_mode") or "all",
                "filters": [dict(a) for a in alerts.mappings()],
            })
        return agents

    return router
