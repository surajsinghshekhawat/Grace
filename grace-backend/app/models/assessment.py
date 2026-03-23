from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    answers: Mapped[dict] = mapped_column(JSON, nullable=False)

    depression_risk: Mapped[str] = mapped_column(nullable=False)
    depression_probability: Mapped[float] = mapped_column(nullable=False)
    qol_score: Mapped[float] = mapped_column(nullable=False)
    qol_score_0_100: Mapped[float] = mapped_column(nullable=False)
    top_factors: Mapped[list] = mapped_column(JSON, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

