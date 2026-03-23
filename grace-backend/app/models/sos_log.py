from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ElderSosLog(Base):
    __tablename__ = "elder_sos_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
