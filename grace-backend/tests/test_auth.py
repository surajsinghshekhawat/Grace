from __future__ import annotations

import pytest
from httpx import AsyncClient

from app import config
from tests.conftest import unique_email


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    email = unique_email()
    reg = await client.post(
        "/api/register",
        json={"email_or_phone": email, "password": "secret12", "role": "elder", "name": "A"},
    )
    assert reg.status_code == 200
    body = reg.json()
    assert body.get("id")
    assert body.get("email_or_phone") == email
    assert reg.cookies.get(config.ACCESS_TOKEN_COOKIE_NAME)

    me = await client.get("/api/me")
    assert me.status_code == 200
    assert me.json().get("email_or_phone") == email

    login = await client.post(
        "/api/login",
        json={"email_or_phone": email, "password": "secret12"},
    )
    assert login.status_code == 200
    assert login.json().get("id")
    assert login.cookies.get(config.ACCESS_TOKEN_COOKIE_NAME)

    bad = await client.post(
        "/api/login",
        json={"email_or_phone": email, "password": "wrongpass"},
    )
    assert bad.status_code == 401


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    email = unique_email()
    body = {"email_or_phone": email, "password": "secret12", "role": "elder", "name": "A"}
    assert (await client.post("/api/register", json=body)).status_code == 200
    dup = await client.post("/api/register", json=body)
    assert dup.status_code == 409


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient):
    email = unique_email()
    reg = await client.post(
        "/api/register",
        json={"email_or_phone": email, "password": "secret12", "role": "elder", "name": "L"},
    )
    assert reg.status_code == 200
    assert reg.cookies.get(config.ACCESS_TOKEN_COOKIE_NAME)

    out = await client.post("/api/logout")
    assert out.status_code == 200
    # Next protected call should fail without cookie
    stale = await client.get("/api/me")
    assert stale.status_code == 401
