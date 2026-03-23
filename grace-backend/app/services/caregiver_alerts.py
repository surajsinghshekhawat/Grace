"""
Create caregiver-facing alerts when risk signals fire. Dedupe within a time window per elder+kind.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.caregiver_alert import CaregiverAlert
from app.models.daily_check_in import DailyCheckIn

# Tunables
DEPRESSION_PROB_THRESHOLD = 0.5
LOW_MOOD_MAX = 2  # 1–5 scale; streak = low mood *and* low energy
STREAK_LEN = 3
DEDUPE_HOURS = 48


async def _recent_same_kind(
    db: AsyncSession, elder_user_id: int, kind: str, hours: int = DEDUPE_HOURS
) -> bool:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    res = await db.execute(
        select(CaregiverAlert.id)
        .where(
            CaregiverAlert.elder_user_id == elder_user_id,
            CaregiverAlert.kind == kind,
            CaregiverAlert.created_at >= since,
        )
        .limit(1)
    )
    return res.scalar_one_or_none() is not None


async def create_alert(
    db: AsyncSession,
    *,
    elder_user_id: int,
    kind: str,
    severity: str,
    title: str,
    message: str,
    context: dict[str, Any] | None = None,
    dedupe: bool = True,
    dedupe_hours: int = DEDUPE_HOURS,
) -> CaregiverAlert | None:
    if dedupe and await _recent_same_kind(db, elder_user_id, kind, hours=dedupe_hours):
        return None
    row = CaregiverAlert(
        elder_user_id=elder_user_id,
        kind=kind,
        severity=severity,
        title=title,
        message=message,
        context_json=context or {},
    )
    db.add(row)
    await db.flush()
    return row


async def maybe_alert_depression_assessment(
    db: AsyncSession,
    *,
    elder_user_id: int,
    depression_probability: float,
    survey_mode: str | None = None,
) -> None:
    if depression_probability < DEPRESSION_PROB_THRESHOLD:
        return
    ctx = {"depression_probability": depression_probability, "survey_mode": survey_mode}
    await create_alert(
        db,
        elder_user_id=elder_user_id,
        kind="depression_elevated",
        severity="high",
        title="Elevated depression concern on assessment",
        message=(
            "A recent wellbeing assessment suggests elevated concern on the screening model. "
            "This is not a diagnosis — consider checking in with the elder and their clinician if low mood persists."
        ),
        context=ctx,
    )


async def maybe_alert_low_mood_streak(db: AsyncSession, *, elder_user_id: int) -> None:
    """After a new check-in: if last 3 check-ins (incl. this one) all have mood <= LOW_MOOD_MAX."""
    res = await db.execute(
        select(DailyCheckIn)
        .where(DailyCheckIn.elder_user_id == elder_user_id)
        .order_by(DailyCheckIn.created_at.desc())
        .limit(STREAK_LEN)
    )
    rows = list(res.scalars().all())
    if len(rows) < STREAK_LEN:
        return
    if not all(c.mood <= LOW_MOOD_MAX and c.energy <= LOW_MOOD_MAX for c in rows):
        return
    await create_alert(
        db,
        elder_user_id=elder_user_id,
        kind="low_mood_streak",
        severity="medium",
        title="Several low mood & energy check-ins",
        message=(
            f"The last {STREAK_LEN} daily check-ins reported low mood and low energy. "
            "A gentle call or visit may help — and professional support if this continues."
        ),
        context={
            "mood_values": [c.mood for c in rows],
            "energy_values": [c.energy for c in rows],
            "check_in_ids": [c.id for c in rows],
        },
    )


async def alert_sos_pressed(db: AsyncSession, *, elder_user_id: int) -> None:
    await create_alert(
        db,
        elder_user_id=elder_user_id,
        kind="sos_pressed",
        severity="critical",
        title="Emergency SOS recorded",
        message="The elder pressed the in-app SOS button. Follow your care plan and local emergency procedures if needed.",
        context={},
        dedupe=True,
        dedupe_hours=2,  # avoid duplicate rows if they tap twice; still re-alert after 2h
    )
