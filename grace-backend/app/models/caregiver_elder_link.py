from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CaregiverElderLink(Base):
    __tablename__ = "caregiver_elder_links"
    __table_args__ = (
        UniqueConstraint("caregiver_user_id", "elder_user_id", name="uq_caregiver_elder_pair"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    caregiver_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

