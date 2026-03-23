from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_resources_default_english(client: AsyncClient):
    r = await client.get("/api/resources")
    assert r.status_code == 200
    data = r.json()
    assert any(i.get("id") == "mindfulness_relaxation" and "Mindfulness" in i.get("title", "") for i in data)
    assert all("lang" not in i for i in data)


@pytest.mark.asyncio
async def test_resources_hindi_titles(client: AsyncClient):
    r = await client.get("/api/resources?lang=hi")
    assert r.status_code == 200
    row = next(i for i in r.json() if i["id"] == "mindfulness_relaxation")
    assert "माइंडफुलनेस" in row["title"] or "माइंडफुलनेस" in row.get("title", "")
    assert row.get("lang") == "hi"


@pytest.mark.asyncio
async def test_resources_categories_hi(client: AsyncClient):
    r = await client.get("/api/resources/categories?lang=hi")
    assert r.status_code == 200
    names = [x["name"] for x in r.json()]
    assert any("शांति" in n or "नींद" in n for n in names)


@pytest.mark.asyncio
async def test_resource_detail_ta(client: AsyncClient):
    r = await client.get("/api/resources/crisis_help?lang=ta")
    assert r.status_code == 200
    body = r.json()
    assert body.get("lang") == "ta"
    assert "நெருக்கடி" in body.get("title", "") or "அவசர" in body.get("title", "")
