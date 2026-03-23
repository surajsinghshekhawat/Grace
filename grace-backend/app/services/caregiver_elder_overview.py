"""
Single-elder snapshot for caregiver dashboard cards (batch via /api/caregiver/elders-overview).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment
from app.models.caregiver_alert import CaregiverAlert, CaregiverAlertDismissal
from app.models.daily_check_in import DailyCheckIn
from app.models.sos_log import ElderSosLog
from app.services.medication_adherence import compute_medication_adherence

# QoL stored 0–100; delta threshold for trend label
QOL_DELTA_THRESHOLD = 3.0


def _aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def build_caregiver_elder_overview_row(
    db: AsyncSession,
    *,
    caregiver_user_id: int,
    elder_user_id: int,
    elder_name: str | None,
) -> dict:
    ar = await db.execute(
        select(Assessment)
        .where(Assessment.elder_user_id == elder_user_id)
        .order_by(Assessment.created_at.desc())
        .limit(2)
    )
    assess_rows = list(ar.scalars().all())
    latest = assess_rows[0] if assess_rows else None
    prev = assess_rows[1] if len(assess_rows) > 1 else None

    depression_risk = (latest.depression_risk or "").lower() if latest else None
    prob = float(latest.depression_probability) if latest else None
    mental = round((1 - prob) * 100, 1) if prob is not None else None
    qol10 = round(latest.qol_score_0_100 / 10, 1) if latest and latest.qol_score_0_100 is not None else None

    qol_trend = "unknown"
    if latest and prev:
        d = float(latest.qol_score_0_100) - float(prev.qol_score_0_100)
        if d > QOL_DELTA_THRESHOLD:
            qol_trend = "up"
        elif d < -QOL_DELTA_THRESHOLD:
            qol_trend = "down"
        else:
            qol_trend = "steady"

    cr = await db.execute(
        select(DailyCheckIn)
        .where(DailyCheckIn.elder_user_id == elder_user_id)
        .order_by(DailyCheckIn.created_at.desc())
        .limit(1)
    )
    last_ci = cr.scalar_one_or_none()

    adh = await compute_medication_adherence(db, elder_user_id=elder_user_id, days=7)
    adh_pct = adh.get("adherence_pct")
    med_count = int(adh.get("medication_count") or 0)
    unmarked_today = int(adh.get("unmarked_today_count") or 0)

    since7 = datetime.now(timezone.utc) - timedelta(days=7)
    sr = await db.execute(
        select(func.count())
        .select_from(ElderSosLog)
        .where(ElderSosLog.elder_user_id == elder_user_id, ElderSosLog.created_at >= since7)
    )
    sos_n = int(sr.scalar_one() or 0)

    dismissed_exists = exists(
        select(CaregiverAlertDismissal.id).where(
            CaregiverAlertDismissal.alert_id == CaregiverAlert.id,
            CaregiverAlertDismissal.caregiver_user_id == caregiver_user_id,
        )
    )
    alert_q = await db.execute(
        select(func.count())
        .select_from(CaregiverAlert)
        .where(CaregiverAlert.elder_user_id == elder_user_id, ~dismissed_exists)
    )
    open_alerts = int(alert_q.scalar_one() or 0)

    reasons: list[str] = []
    needs = False
    if depression_risk == "elevated":
        needs = True
        reasons.append("elevated_risk")
    if sos_n > 0:
        needs = True
        reasons.append("recent_sos")
    if adh_pct is not None and med_count > 0 and adh_pct < 55:
        needs = True
        reasons.append("low_adherence")
    if unmarked_today > 0 and med_count > 0:
        needs = True
        reasons.append("meds_today")
    if open_alerts > 0:
        needs = True
        reasons.append("open_alerts")
    if last_ci is None:
        needs = True
        reasons.append("no_checkin")
    else:
        hours = (datetime.now(timezone.utc) - _aware(last_ci.created_at)).total_seconds() / 3600
        if hours > 72:
            needs = True
            reasons.append("stale_checkin")

    return {
        "elder_user_id": elder_user_id,
        "elder_name": (elder_name or "").strip() or f"Elder {elder_user_id}",
        "last_check_in_at": last_ci.created_at if last_ci else None,
        "depression_risk": depression_risk,
        "mental_wellbeing_0_100": mental,
        "qol_out_of_10": qol10,
        "qol_trend": qol_trend,
        "medication_adherence_pct": adh_pct,
        "medication_count": med_count,
        "unmarked_meds_today": unmarked_today,
        "sos_events_last_7_days": sos_n,
        "open_alerts_count": open_alerts,
        "needs_attention": needs,
        "attention_reasons": reasons,
    }
