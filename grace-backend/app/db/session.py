from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import DB_PATH


def _db_url() -> str:
    # sqlite+aiosqlite:///C:/.../grace.db
    return f"sqlite+aiosqlite:///{DB_PATH.as_posix()}"


engine: AsyncEngine = create_async_engine(_db_url(), echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

