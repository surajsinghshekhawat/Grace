"""
7-day (configurable) medication adherence from dose logs.
Assumption: at most one expected dose per medication per UTC calendar day.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.elder_medication import ElderMedication, MedicationDoseLog


def _utc_day_start(d: datetime) -> datetime:
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


async def compute_medication_adherence(
    db: AsyncSession,
    *,
    elder_user_id: int,
    days: int = 7,
) -> dict:
    days = max(1, min(90, days))
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=days)
    today_start = _utc_day_start(now)

    res = await db.execute(
        select(ElderMedication)
        .where(ElderMedication.elder_user_id == elder_user_id)
        .order_by(ElderMedication.sort_order, ElderMedication.id)
    )
    meds = list(res.scalars().all())

    if not meds:
        return {
            "days": days,
            "medication_count": 0,
            "expected_dose_days": 0,
            "covered_dose_days": 0,
            "adherence_pct": None,
            "unmarked_today_count": 0,
            "unmarked_today_names": [],
            "reminder_message": None,
        }

    med_ids = [m.id for m in meds]
    log_res = await db.execute(
        select(MedicationDoseLog).where(
            MedicationDoseLog.elder_user_id == elder_user_id,
            MedicationDoseLog.medication_id.in_(med_ids),
            MedicationDoseLog.taken_at >= window_start,
            MedicationDoseLog.taken_at <= now,
        )
    )
    logs = list(log_res.scalars().all())

    today_res = await db.execute(
        select(MedicationDoseLog.medication_id)
        .where(
            MedicationDoseLog.elder_user_id == elder_user_id,
            MedicationDoseLog.medication_id.in_(med_ids),
            MedicationDoseLog.taken_at >= today_start,
        )
        .distinct()
    )
    taken_today_med_ids = {int(x) for x in today_res.scalars().all()}

    # med_id -> set of UTC dates with at least one log in window
    days_with_log: dict[int, set] = defaultdict(set)
    for lg in logs:
        ts = lg.taken_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        days_with_log[lg.medication_id].add(ts.astimezone(timezone.utc).date())

    expected_total = 0
    covered_total = 0
    unmarked_names: list[str] = []

    for med in meds:
        created = med.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        period_start = max(window_start, created)
        if period_start > now:
            continue
        d0 = period_start.astimezone(timezone.utc).date()
        d1 = now.astimezone(timezone.utc).date()
        span = (d1 - d0).days + 1
        expected_i = min(days, max(0, span))
        if expected_i <= 0:
            continue
        expected_total += expected_i
        logged_dates = days_with_log.get(med.id, set())
        covered_i = 0
        cur = d0
        while cur <= d1:
            if cur in logged_dates:
                covered_i += 1
            cur = cur + timedelta(days=1)
        covered_i = min(expected_i, covered_i)
        covered_total += covered_i

        if med.id not in taken_today_med_ids:
            unmarked_names.append(med.name.strip() or "Medication")

    pct = None
    if expected_total > 0:
        pct = min(100, max(0, round(100 * covered_total / expected_total)))

    reminder = None
    if unmarked_names:
        shown = unmarked_names[:3]
        suffix = f" (+{len(unmarked_names) - 3} more)" if len(unmarked_names) > 3 else ""
        reminder = f"You haven’t marked today’s dose for: {', '.join(shown)}{suffix}. Tap Health when you can."

    return {
        "days": days,
        "medication_count": len(meds),
        "expected_dose_days": expected_total,
        "covered_dose_days": covered_total,
        "adherence_pct": pct,
        "unmarked_today_count": len(unmarked_names),
        "unmarked_today_names": unmarked_names[:5],
        "reminder_message": reminder,
    }
