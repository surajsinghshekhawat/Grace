from __future__ import annotations

from pydantic import BaseModel, Field


class MedicationAdherencePublic(BaseModel):
    """Rolling window adherence: each med expects 1 log per calendar day (UTC), capped by days med existed in window."""

    days: int = Field(ge=1, le=90, description="Window length in days")
    medication_count: int
    expected_dose_days: int
    covered_dose_days: int
    adherence_pct: int | None = None  # None if no medications
    unmarked_today_count: int = 0
    unmarked_today_names: list[str] = Field(default_factory=list)
    reminder_message: str | None = None
