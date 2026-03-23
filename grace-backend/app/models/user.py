from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, UniqueConstraint, false
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email_or_phone", name="uq_users_email_or_phone"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email_or_phone: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # elder | caregiver
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_moderator: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

