from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)
    large_text: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    high_contrast: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    checkin_reminders: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    language: Mapped[str] = mapped_column(String(64), nullable=False, default="English")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
