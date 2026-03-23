from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_moderator_reports_forbidden_for_elder(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/moderator/community-reports", headers=auth_headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_moderator_reports_allowed_when_id_in_env(
    client: AsyncClient,
    elder_token: str,
    monkeypatch: pytest.MonkeyPatch,
):
    # Decode user id from /api/me
    me = await client.get("/api/me", headers={"Authorization": f"Bearer {elder_token}"})
    assert me.status_code == 200
    uid = me.json()["id"]

    monkeypatch.setenv("GRACE_MODERATOR_IDS", str(uid))

    r = await client.get(
        "/api/moderator/community-reports",
        headers={"Authorization": f"Bearer {elder_token}"},
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)
