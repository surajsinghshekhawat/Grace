from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.caregiver_alert import CaregiverAlert, CaregiverAlertDismissal
from app.models.caregiver_elder_link import CaregiverElderLink
from app.models.user import User
from app.security.deps import get_current_user
from pydantic import BaseModel


router = APIRouter(tags=["caregiver-alerts"])


class CaregiverAlertPublic(BaseModel):
    id: int
    elder_user_id: int
    elder_name: str | None = None
    kind: str
    severity: str
    title: str
    message: str
    context_json: dict | None = None
    created_at: datetime
    dismissed: bool = False


async def _elder_name(db: AsyncSession, elder_user_id: int) -> str | None:
    res = await db.execute(select(User).where(User.id == elder_user_id))
    u = res.scalar_one_or_none()
    return (u.name or "").strip() or None if u else None


@router.get("/api/caregiver/alerts", response_model=list[CaregiverAlertPublic])
async def list_caregiver_alerts(
    limit: int = 50,
    include_dismissed: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view alerts")
    limit = max(1, min(100, limit))

    res = await db.execute(
        select(CaregiverElderLink.elder_user_id).where(CaregiverElderLink.caregiver_user_id == current_user.id)
    )
    elder_ids = [int(x) for x in res.scalars().all()]
    if not elder_ids:
        return []

    dismissed_ids: set[int] = set()
    dr = await db.execute(
        select(CaregiverAlertDismissal.alert_id).where(CaregiverAlertDismissal.caregiver_user_id == current_user.id)
    )
    dismissed_ids = {int(x) for x in dr.scalars().all()}

    ar = await db.execute(
        select(CaregiverAlert)
        .where(CaregiverAlert.elder_user_id.in_(elder_ids))
        .order_by(CaregiverAlert.created_at.desc())
        .limit(limit * 2)
    )
    rows = list(ar.scalars().all())

    out: list[CaregiverAlertPublic] = []
    for a in rows:
        is_dismissed = a.id in dismissed_ids
        if is_dismissed and not include_dismissed:
            continue
        name = await _elder_name(db, a.elder_user_id)
        out.append(
            CaregiverAlertPublic(
                id=a.id,
                elder_user_id=a.elder_user_id,
                elder_name=name,
                kind=a.kind,
                severity=a.severity,
                title=a.title,
                message=a.message,
                context_json=a.context_json,
                created_at=a.created_at,
                dismissed=is_dismissed,
            )
        )
        if len(out) >= limit:
            break
    return out


@router.post("/api/caregiver/alerts/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can dismiss alerts")

    res = await db.execute(select(CaregiverAlert).where(CaregiverAlert.id == alert_id))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    res = await db.execute(
        select(CaregiverElderLink).where(
            CaregiverElderLink.caregiver_user_id == current_user.id,
            CaregiverElderLink.elder_user_id == alert.elder_user_id,
        )
    )
    if res.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    existing = await db.execute(
        select(CaregiverAlertDismissal).where(
            CaregiverAlertDismissal.alert_id == alert_id,
            CaregiverAlertDismissal.caregiver_user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(
            CaregiverAlertDismissal(
                alert_id=alert_id,
                caregiver_user_id=current_user.id,
                dismissed_at=datetime.now(timezone.utc),
            )
        )
        await db.commit()
    return {"ok": True}
