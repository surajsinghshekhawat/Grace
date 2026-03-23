"""Shared wellbeing insights payload for elder dashboard and caregiver (linked elder) views."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.answer_wellbeing import blended_qol_0_100
from app.models.assessment import Assessment
from app.models.daily_check_in import DailyCheckIn
from app.recommendations import build_recommendations, wellness_index_0_100
from app.recommendations_i18n import recommendations_for_api


async def build_wellbeing_insights_payload(
    db: AsyncSession,
    elder_user_id: int,
    lang: str | None,
) -> dict:
    """
    Refreshed recommendations and blended QoL from latest assessment + recent check-ins.
    """
    res = await db.execute(
        select(Assessment)
        .where(Assessment.elder_user_id == elder_user_id)
        .order_by(Assessment.created_at.desc())
        .limit(1)
    )
    row = res.scalar_one_or_none()

    since = datetime.now(timezone.utc) - timedelta(days=14)
    cin = await db.execute(
        select(DailyCheckIn)
        .where(DailyCheckIn.elder_user_id == elder_user_id, DailyCheckIn.created_at >= since)
        .order_by(DailyCheckIn.created_at.desc())
    )
    check_ins = list(cin.scalars().all())
    daily_avg = None
    if check_ins:
        slice_c = check_ins[:10]
        daily_avg = sum((c.mood + c.energy + c.sleep) / 3 for c in slice_c) / len(slice_c)

    if row is None:
        return {
            "has_assessment": False,
            "blended_qol_0_100": None,
            "qol_out_of_10": None,
            "depression_probability": None,
            "mental_wellbeing_0_100": None,
            "wellness_index_0_100": None,
            "recommendations": [],
            "top_factors": [],
            "daily_check_in_avg_1_5": round(daily_avg, 2) if daily_avg is not None else None,
        }

    blended, _m, _n = blended_qol_0_100(float(row.qol_score), dict(row.answers or {}))
    blended = round(blended, 1)
    prob = float(row.depression_probability)
    mental = round((1 - prob) * 100, 1)
    wi = wellness_index_0_100(prob, blended, daily_avg)

    recs_raw = build_recommendations(dict(row.answers or {}), prob, blended, max_items=10)
    factors = recommendations_for_api(recs_raw, lang)

    return {
        "has_assessment": True,
        "blended_qol_0_100": blended,
        "qol_out_of_10": round(blended / 10, 1),
        "depression_probability": prob,
        "mental_wellbeing_0_100": mental,
        "wellness_index_0_100": wi,
        "recommendations": factors,
        "top_factors": factors,
        "daily_check_in_avg_1_5": round(daily_avg, 2) if daily_avg is not None else None,
    }
