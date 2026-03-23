"""Pytest: set env before importing the app (DB path, secrets)."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

# Must run before `main` / `app.db.session` import
_TEST_DB = Path(__file__).resolve().parent / "pytest_grace.db"
os.environ["GRACE_DB_PATH"] = str(_TEST_DB)
os.environ.setdefault("GRACE_SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ["GRACE_ALLOW_PUBLIC_PREDICT"] = "1"
os.environ.pop("GRACE_MODERATOR_IDS", None)

import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app import config
from app.db.init_db import init_db
from app.db.session import engine
from main import app

# Tables without running FastAPI lifespan (httpx ASGITransport may not run lifespan on older httpx).
asyncio.run(init_db(engine))


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def unique_email(prefix: str = "u") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}@test.local"


@pytest_asyncio.fixture
async def elder_token(client: AsyncClient) -> str:
    email = unique_email("elder")
    r = await client.post(
        "/api/register",
        json={"email_or_phone": email, "password": "secret12", "role": "elder", "name": "Elder Test"},
    )
    assert r.status_code == 200, r.text
    tok = r.cookies.get(config.ACCESS_TOKEN_COOKIE_NAME)
    assert tok, r.text
    return tok


@pytest_asyncio.fixture
async def caregiver_token(client: AsyncClient) -> str:
    email = unique_email("cg")
    r = await client.post(
        "/api/register",
        json={"email_or_phone": email, "password": "secret12", "role": "caregiver", "name": "CG Test"},
    )
    assert r.status_code == 200, r.text
    tok = r.cookies.get(config.ACCESS_TOKEN_COOKIE_NAME)
    assert tok, r.text
    return tok


@pytest_asyncio.fixture
async def auth_headers(elder_token: str):
    return {"Authorization": f"Bearer {elder_token}"}


@pytest_asyncio.fixture
async def cg_headers(caregiver_token: str):
    return {"Authorization": f"Bearer {caregiver_token}"}
