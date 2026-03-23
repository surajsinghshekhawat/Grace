from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_caregiver_cannot_create_invite(client: AsyncClient, cg_headers: dict):
    r = await client.post("/api/elder/invite", headers=cg_headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_elder_invite_and_caregiver_links(
    client: AsyncClient,
    auth_headers: dict,
    cg_headers: dict,
):
    inv = await client.post("/api/elder/invite", headers=auth_headers)
    assert inv.status_code == 200
    code = inv.json()["code"]

    link = await client.post(
        "/api/caregiver/link-elder",
        headers=cg_headers,
        json={"code": code},
    )
    assert link.status_code == 200
    data = link.json()
    assert "elder_user_id" in data

    bad = await client.post(
        "/api/caregiver/link-elder",
        headers=cg_headers,
        json={"code": code},
    )
    assert bad.status_code in (400, 409)

    overview = await client.get("/api/caregiver/elders-overview", headers=cg_headers)
    assert overview.status_code == 200
    rows = overview.json()
    assert isinstance(rows, list)
    assert len(rows) >= 1
    assert any(r.get("elder_user_id") == data["elder_user_id"] for r in rows)

    eid = data["elder_user_id"]
    asm = await client.get(f"/api/caregiver/elders/{eid}/assessments?limit=5", headers=cg_headers)
    assert asm.status_code == 200
    assert isinstance(asm.json(), list)

    ins = await client.get(f"/api/caregiver/elders/{eid}/wellbeing-insights?lang=en", headers=cg_headers)
    assert ins.status_code == 200
    body = ins.json()
    assert "has_assessment" in body
    assert "recommendations" in body
