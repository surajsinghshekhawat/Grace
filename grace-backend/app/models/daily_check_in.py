from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DailyCheckIn(Base):
    __tablename__ = "daily_check_ins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    mood: Mapped[int] = mapped_column(Integer, nullable=False)       # 1-5
    energy: Mapped[int] = mapped_column(Integer, nullable=False)     # 1-5
    sleep: Mapped[int] = mapped_column(Integer, nullable=False)      # 1-5
    appetite: Mapped[int] = mapped_column(Integer, nullable=False)   # 1-5
    pain: Mapped[int] = mapped_column(Integer, nullable=False)       # 1-5
    loneliness: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

