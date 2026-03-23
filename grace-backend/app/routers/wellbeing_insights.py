from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.security.deps import get_current_user
from app.services.wellbeing_insights import build_wellbeing_insights_payload

router = APIRouter(tags=["wellbeing"])


@router.get("/api/elder/wellbeing-insights")
async def elder_wellbeing_insights(
    lang: str | None = Query(None, description="Language hint: en, hi, ta"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Refreshed recommendations and blended QoL from the latest assessment + recent check-ins.
    Use this for Home dashboard so older DB rows still get corrected QoL blending.
    """
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can view wellbeing insights")

    return await build_wellbeing_insights_payload(db, current_user.id, lang)
