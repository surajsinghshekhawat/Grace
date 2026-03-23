from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.predict import predict
from app.schemas.assessments import AssessmentCreate, AssessmentPublic, assessment_row_to_public
from app.security.deps import get_current_user
from app.services.caregiver_alerts import maybe_alert_depression_assessment


router = APIRouter(tags=["assessments"])


@router.post("/api/elder/assessments", response_model=AssessmentPublic)
async def create_elder_assessment(
    body: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can create assessments")

    result = predict(body.answers)
    row = Assessment(
        elder_user_id=current_user.id,
        created_by_user_id=current_user.id,
        answers=body.answers,
        depression_risk=result["depression_risk"],
        depression_probability=float(result["depression_probability"]),
        qol_score=float(result["qol_score"]),
        qol_score_0_100=float(result["qol_score_0_100"]),
        top_factors=result["top_factors"],
    )
    db.add(row)
    await maybe_alert_depression_assessment(
        db,
        elder_user_id=current_user.id,
        depression_probability=float(result["depression_probability"]),
        survey_mode=body.survey_meta.mode if body.survey_meta else None,
    )
    await db.commit()
    await db.refresh(row)
    return assessment_row_to_public(row, body.survey_meta)


@router.get("/api/elder/assessments", response_model=list[AssessmentPublic])
async def list_elder_assessments(
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can view assessments")
    limit = max(1, min(52, limit))

    res = await db.execute(
        select(Assessment)
        .where(Assessment.elder_user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .limit(limit)
    )
    rows = list(res.scalars().all())
    return [assessment_row_to_public(r) for r in rows]

