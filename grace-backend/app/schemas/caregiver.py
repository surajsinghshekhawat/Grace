from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.assessments import AssessmentPublic
from app.schemas.checkins import DailyCheckInPublic
from app.schemas.profile import ElderProfilePublic


class CaregiverElderOverviewItem(BaseModel):
    """One row for caregiver home — avoids N+1 client calls."""

    elder_user_id: int
    elder_name: str | None = None
    last_check_in_at: datetime | None = None
    depression_risk: str | None = None
    mental_wellbeing_0_100: float | None = None
    qol_out_of_10: float | None = None
    qol_trend: Literal["up", "down", "steady", "unknown"] = "unknown"
    medication_adherence_pct: int | None = None
    medication_count: int = 0
    unmarked_meds_today: int = 0
    sos_events_last_7_days: int = 0
    open_alerts_count: int = 0
    needs_attention: bool = False
    attention_reasons: list[str] = []


class ElderSummary(BaseModel):
    elder_user_id: int
    elder_name: str | None
    elder_profile: ElderProfilePublic | None
    latest_assessment: AssessmentPublic | None
    recent_check_ins: list[DailyCheckInPublic]
    updated_at: datetime

