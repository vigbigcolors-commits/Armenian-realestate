"""HTTP client for SmartEstate API (realtor bot)."""
import os
from typing import Any, Optional

import httpx

API_BASE = os.getenv("API_BASE_URL", "http://api:8000")
TIMEOUT = 20.0


class ApiClient:
    async def _request(self, method: str, path: str, **kwargs) -> Any:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.request(method, f"{API_BASE}{path}", **kwargs)
            if resp.status_code >= 400:
                detail = resp.text[:200]
                raise httpx.HTTPStatusError(
                    f"{method} {path} → {resp.status_code}: {detail}",
                    request=resp.request,
                    response=resp,
                )
            if resp.status_code == 204:
                return None
            return resp.json()

    async def register_agent(
        self,
        telegram_id: int,
        username: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> dict:
        return await self._request(
            "POST",
            "/api/bot/register",
            json={
                "telegram_id": telegram_id,
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

    async def get_agent(self, telegram_id: int) -> dict:
        return await self._request("GET", f"/api/bot/agent/{telegram_id}")

    async def subscribe_pro(self, telegram_id: int) -> dict:
        return await self._request(
            "POST",
            "/api/payments/subscribe-pro",
            json={
                "telegram_id": telegram_id,
                "payment_method": "demo",
                "client_token": f"tg_{telegram_id}",
            },
        )

    async def add_lead_filter(self, payload: dict) -> dict:
        return await self._request("POST", "/api/bot/lead-filters", json=payload)

    async def delete_lead_filter(self, alert_id: str, telegram_id: int) -> dict:
        return await self._request(
            "DELETE",
            f"/api/bot/lead-filters/{alert_id}",
            params={"telegram_id": telegram_id},
        )

    async def clear_lead_filters(self, telegram_id: int) -> dict:
        return await self._request(
            "DELETE",
            "/api/bot/lead-filters",
            params={"telegram_id": telegram_id},
        )

    async def set_notify_mode(self, telegram_id: int, mode: str) -> dict:
        return await self._request(
            "PATCH",
            f"/api/bot/agent/{telegram_id}/notify-mode",
            json={"notify_mode": mode},
        )

    async def list_pro_agents(self) -> list[dict]:
        return await self._request("GET", "/api/bot/pro-agents")

    async def list_districts(self) -> list[str]:
        return await self._request("GET", "/api/districts")


api = ApiClient()
