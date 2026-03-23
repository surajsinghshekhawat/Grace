from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CaregiverAlert(Base):
    """Alert row for linked caregivers (depression threshold, mood streak, SOS, etc.)."""

    __tablename__ = "caregiver_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    elder_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)  # critical, high, medium
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    context_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class CaregiverAlertDismissal(Base):
    """Per-caregiver dismiss so lists stay tidy across sessions."""

    __tablename__ = "caregiver_alert_dismissals"
    __table_args__ = (UniqueConstraint("alert_id", "caregiver_user_id", name="uq_alert_caregiver_dismissal"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[int] = mapped_column(Integer, ForeignKey("caregiver_alerts.id"), nullable=False, index=True)
    caregiver_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    dismissed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


