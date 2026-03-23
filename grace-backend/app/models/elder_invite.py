from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ElderInvite(Base):
    __tablename__ = "elder_invites"
    __table_args__ = (UniqueConstraint("code", name="uq_elder_invites_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(32), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

