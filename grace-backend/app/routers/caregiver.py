from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.caregiver_elder_link import CaregiverElderLink
from app.models.daily_check_in import DailyCheckIn
from app.models.elder_profile import ElderProfile
from app.models.elder_medication import ElderMedication, MedicationDoseLog
from app.models.user import User
from app.predict import predict
from app.schemas.assessments import AssessmentCreate, AssessmentPublic, assessment_row_to_public
from app.schemas.medication_adherence import MedicationAdherencePublic
from app.schemas.caregiver import CaregiverElderOverviewItem, ElderSummary
from app.schemas.checkins import DailyCheckInCreate, DailyCheckInPublic
from app.schemas.medications import MedicationCreate, MedicationPublic, MedicationUpdate
from app.schemas.profile import ElderProfilePublic
from app.security.deps import get_current_user
from app.services.caregiver_elder_overview import build_caregiver_elder_overview_row
from app.services.caregiver_alerts import maybe_alert_depression_assessment, maybe_alert_low_mood_streak
from app.services.medication_adherence import compute_medication_adherence
from app.services.wellbeing_insights import build_wellbeing_insights_payload


router = APIRouter(tags=["caregiver"])


def _aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _utc_day_start() -> datetime:
    n = datetime.now(timezone.utc)
    return n.replace(hour=0, minute=0, second=0, microsecond=0)


async def _med_to_public(db: AsyncSession, med: ElderMedication) -> MedicationPublic:
    day_start = _utc_day_start()
    taken = await db.execute(
        select(MedicationDoseLog)
        .where(
            MedicationDoseLog.medication_id == med.id,
            MedicationDoseLog.taken_at >= day_start,
        )
        .order_by(MedicationDoseLog.taken_at.desc())
        .limit(1)
    )
    row = taken.scalar_one_or_none()
    last_any = await db.execute(
        select(MedicationDoseLog)
        .where(MedicationDoseLog.medication_id == med.id)
        .order_by(MedicationDoseLog.taken_at.desc())
        .limit(1)
    )
    last_row = last_any.scalar_one_or_none()
    return MedicationPublic(
        id=med.id,
        elder_user_id=med.elder_user_id,
        name=med.name,
        dosage=med.dosage,
        schedule_time=med.schedule_time,
        sort_order=med.sort_order,
        taken_today=row is not None,
        last_taken_at=last_row.taken_at if last_row else None,
        created_at=med.created_at,
    )


async def _require_linked_elder(
    *,
    db: AsyncSession,
    caregiver_user_id: int,
    elder_user_id: int,
) -> User:
    res = await db.execute(
        select(CaregiverElderLink).where(
            CaregiverElderLink.caregiver_user_id == caregiver_user_id,
            CaregiverElderLink.elder_user_id == elder_user_id,
        )
    )
    link = res.scalar_one_or_none()
    if link is None:
        raise HTTPException(status_code=404, detail="Elder not linked")

    res = await db.execute(select(User).where(User.id == elder_user_id))
    elder = res.scalar_one_or_none()
    if elder is None or elder.role != "elder":
        raise HTTPException(status_code=404, detail="Elder not found")
    return elder


@router.get("/api/caregiver/elders-overview", response_model=list[CaregiverElderOverviewItem])
async def caregiver_elders_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rich dashboard rows for all linked elders (check-in, risk, QoL trend, adherence, SOS, open alerts)."""
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view this")

    res = await db.execute(
        select(CaregiverElderLink, User)
        .join(User, User.id == CaregiverElderLink.elder_user_id)
        .where(CaregiverElderLink.caregiver_user_id == current_user.id)
        .order_by(CaregiverElderLink.created_at.desc())
    )
    out: list[CaregiverElderOverviewItem] = []
    for _link, elder in res.all():
        raw = await build_caregiver_elder_overview_row(
            db,
            caregiver_user_id=current_user.id,
            elder_user_id=elder.id,
            elder_name=elder.name,
        )
        out.append(CaregiverElderOverviewItem.model_validate(raw))
    return out


@router.post("/api/caregiver/elders/{elder_user_id}/assessments", response_model=AssessmentPublic)
async def create_assessment_for_elder(
    elder_user_id: int,
    body: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can create elder assessments")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)

    result = predict(body.answers)
    row = Assessment(
        elder_user_id=elder_user_id,
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
        elder_user_id=elder_user_id,
        depression_probability=float(result["depression_probability"]),
        survey_mode=body.survey_meta.mode if body.survey_meta else None,
    )
    await db.commit()
    await db.refresh(row)
    return assessment_row_to_public(row, body.survey_meta)


@router.post("/api/caregiver/elders/{elder_user_id}/check-ins", response_model=DailyCheckInPublic)
async def create_check_in_for_elder(
    elder_user_id: int,
    body: DailyCheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can create check-ins for elders")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)

    row = DailyCheckIn(elder_user_id=elder_user_id, **body.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    await maybe_alert_low_mood_streak(db, elder_user_id=elder_user_id)
    await db.commit()
    return row


@router.get("/api/caregiver/elders/{elder_user_id}/assessments", response_model=list[AssessmentPublic])
async def list_elder_assessments_for_caregiver(
    elder_user_id: int,
    limit: int = 36,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List assessments for a linked elder (same shape as elder /api/elder/assessments)."""
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    limit = max(1, min(52, limit))
    res = await db.execute(
        select(Assessment)
        .where(Assessment.elder_user_id == elder_user_id)
        .order_by(Assessment.created_at.desc())
        .limit(limit)
    )
    rows = list(res.scalars().all())
    return [assessment_row_to_public(r) for r in rows]


@router.get("/api/caregiver/elders/{elder_user_id}/wellbeing-insights")
async def caregiver_elder_wellbeing_insights(
    elder_user_id: int,
    lang: str | None = Query(None, description="Language hint: en, hi, ta"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Blended QoL, wellness index, and localized recommendations for a linked elder."""
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    return await build_wellbeing_insights_payload(db, elder_user_id, lang)


@router.get("/api/caregiver/elders/{elder_user_id}/summary", response_model=ElderSummary)
async def get_elder_summary(
    elder_user_id: int,
    days: int = 14,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view elder summary")
    elder = await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)

    # Profile (optional)
    res = await db.execute(select(ElderProfile).where(ElderProfile.user_id == elder_user_id))
    profile = res.scalar_one_or_none()

    # Latest assessment (optional)
    res = await db.execute(
        select(Assessment)
        .where(Assessment.elder_user_id == elder_user_id)
        .order_by(Assessment.created_at.desc())
        .limit(1)
    )
    latest_assessment = res.scalar_one_or_none()

    # Recent check-ins
    days = max(1, min(90, days))
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    res = await db.execute(
        select(DailyCheckIn)
        .where(DailyCheckIn.elder_user_id == elder_user_id)
        .order_by(DailyCheckIn.created_at.desc())
        .limit(200)
    )
    checkins = list(res.scalars().all())
    checkins = [c for c in checkins if _aware(c.created_at) >= cutoff]

    return ElderSummary(
        elder_user_id=elder.id,
        elder_name=elder.name,
        elder_profile=ElderProfilePublic.model_validate(profile) if profile else None,
        latest_assessment=assessment_row_to_public(latest_assessment) if latest_assessment else None,
        recent_check_ins=[DailyCheckInPublic.model_validate(c) for c in checkins],
        updated_at=datetime.now(timezone.utc),
    )


@router.get(
    "/api/caregiver/elders/{elder_user_id}/medication-adherence",
    response_model=MedicationAdherencePublic,
)
async def get_elder_medication_adherence_for_caregiver(
    elder_user_id: int,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    raw = await compute_medication_adherence(db, elder_user_id=elder_user_id, days=days)
    return MedicationAdherencePublic.model_validate(raw)


@router.get("/api/caregiver/elders/{elder_user_id}/medications", response_model=list[MedicationPublic])
async def caregiver_list_elder_medications(
    elder_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    res = await db.execute(
        select(ElderMedication)
        .where(ElderMedication.elder_user_id == elder_user_id)
        .order_by(ElderMedication.sort_order, ElderMedication.id)
    )
    meds = list(res.scalars().all())
    return [await _med_to_public(db, m) for m in meds]


@router.post("/api/caregiver/elders/{elder_user_id}/medications", response_model=MedicationPublic)
async def caregiver_create_elder_medication(
    elder_user_id: int,
    body: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can manage this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    row = ElderMedication(
        elder_user_id=elder_user_id,
        name=body.name.strip(),
        dosage=(body.dosage or "").strip(),
        schedule_time=(body.schedule_time or "").strip(),
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return await _med_to_public(db, row)


@router.patch("/api/caregiver/elders/{elder_user_id}/medications/{med_id}", response_model=MedicationPublic)
async def caregiver_update_elder_medication(
    elder_user_id: int,
    med_id: int,
    body: MedicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can manage this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    res = await db.execute(
        select(ElderMedication).where(
            ElderMedication.id == med_id, ElderMedication.elder_user_id == elder_user_id
        )
    )
    med = res.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    if body.name is not None:
        med.name = body.name.strip()
    if body.dosage is not None:
        med.dosage = body.dosage.strip()
    if body.schedule_time is not None:
        med.schedule_time = body.schedule_time.strip()
    if body.sort_order is not None:
        med.sort_order = body.sort_order
    await db.commit()
    await db.refresh(med)
    return await _med_to_public(db, med)


@router.delete("/api/caregiver/elders/{elder_user_id}/medications/{med_id}")
async def caregiver_delete_elder_medication(
    elder_user_id: int,
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can manage this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    res = await db.execute(
        select(ElderMedication).where(
            ElderMedication.id == med_id, ElderMedication.elder_user_id == elder_user_id
        )
    )
    med = res.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    await db.execute(delete(MedicationDoseLog).where(MedicationDoseLog.medication_id == med_id))
    await db.execute(delete(ElderMedication).where(ElderMedication.id == med_id))
    await db.commit()
    return {"ok": True}


@router.post(
    "/api/caregiver/elders/{elder_user_id}/medications/{med_id}/mark-taken",
    response_model=MedicationPublic,
)
async def caregiver_mark_elder_medication_taken(
    elder_user_id: int,
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can manage this")
    await _require_linked_elder(db=db, caregiver_user_id=current_user.id, elder_user_id=elder_user_id)
    res = await db.execute(
        select(ElderMedication).where(
            ElderMedication.id == med_id, ElderMedication.elder_user_id == elder_user_id
        )
    )
    med = res.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.add(MedicationDoseLog(medication_id=med_id, elder_user_id=elder_user_id))
    await db.commit()
    await db.refresh(med)
    return await _med_to_public(db, med)


@router.get("/api/caregiver/medications/today")
async def caregiver_medications_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can view this")
    links = await db.execute(
        select(CaregiverElderLink.elder_user_id).where(
            CaregiverElderLink.caregiver_user_id == current_user.id
        )
    )
    elder_ids = [r[0] for r in links.all()]
    if not elder_ids:
        return []
    users = await db.execute(select(User).where(User.id.in_(elder_ids)))
    name_map = {u.id: (u.name or "").strip() or f"Elder {u.id}" for u in users.scalars().all()}
    meds = await db.execute(
        select(ElderMedication)
        .where(ElderMedication.elder_user_id.in_(elder_ids))
        .order_by(ElderMedication.schedule_time, ElderMedication.sort_order, ElderMedication.id)
    )
    out = []
    for med in meds.scalars().all():
        pub = await _med_to_public(db, med)
        out.append(
            {
                "elder_user_id": med.elder_user_id,
                "elder_name": name_map.get(med.elder_user_id, f"Elder {med.elder_user_id}"),
                "medication": pub.model_dump(),
            }
        )
    return out

