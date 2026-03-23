from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ElderProfile(Base):
    __tablename__ = "elder_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_elder_profiles_user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    age_range: Mapped[str | None] = mapped_column(String(64), nullable=True)
    conditions_summary: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    medications_summary: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

