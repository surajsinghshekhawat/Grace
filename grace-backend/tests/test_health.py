from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") in ("ok", "degraded")
    assert "database" in body
    assert "models_loaded" in body
