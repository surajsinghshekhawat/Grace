from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ElderMedication(Base):
    __tablename__ = "elder_medications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    schedule_time: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class MedicationDoseLog(Base):
    __tablename__ = "medication_dose_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    medication_id: Mapped[int] = mapped_column(Integer, ForeignKey("elder_medications.id"), nullable=False, index=True)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    taken_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
