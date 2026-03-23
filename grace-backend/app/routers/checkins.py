from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.daily_check_in import DailyCheckIn
from app.models.user import User
from app.schemas.checkins import DailyCheckInCreate, DailyCheckInPublic
from app.security.deps import get_current_user
from app.services.caregiver_alerts import maybe_alert_low_mood_streak


router = APIRouter(tags=["check-ins"])


@router.post("/api/check-ins/daily", response_model=DailyCheckInPublic)
async def create_daily_check_in(
    body: DailyCheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can submit daily check-ins")
    row = DailyCheckIn(elder_user_id=current_user.id, **body.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    await maybe_alert_low_mood_streak(db, elder_user_id=current_user.id)
    await db.commit()
    return row


@router.get("/api/check-ins/daily", response_model=list[DailyCheckInPublic])
async def list_daily_check_ins(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can view daily check-ins")
    days = max(1, min(90, days))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    res = await db.execute(
        select(DailyCheckIn)
        .where(
            DailyCheckIn.elder_user_id == current_user.id,
            DailyCheckIn.created_at >= since,
        )
        .order_by(DailyCheckIn.created_at.desc())
    )
    return list(res.scalars().all())

