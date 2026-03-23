from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.limiter import limiter
from app.models.elder_medication import ElderMedication, MedicationDoseLog
from app.models.emergency_contact import ElderEmergencyContact
from app.models.sos_log import ElderSosLog
from app.models.user import User
from app.schemas.emergency_contact import (
    EmergencyContactCreate,
    EmergencyContactPublic,
    EmergencyContactUpdate,
    SosContactDial,
    SosTriggerResponse,
)
from app.schemas.medication_adherence import MedicationAdherencePublic
from app.schemas.medications import MedicationCreate, MedicationPublic, MedicationUpdate
from app.security.deps import get_current_user
from app.services.caregiver_alerts import alert_sos_pressed
from app.services.medication_adherence import compute_medication_adherence


router = APIRouter(tags=["elder_health"])


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


# ---- Medications ----
@router.get("/api/elder/medications", response_model=list[MedicationPublic])
async def list_elder_medications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can list medications")
    res = await db.execute(
        select(ElderMedication)
        .where(ElderMedication.elder_user_id == current_user.id)
        .order_by(ElderMedication.sort_order, ElderMedication.id)
    )
    meds = list(res.scalars().all())
    return [await _med_to_public(db, m) for m in meds]


@router.post("/api/elder/medications", response_model=MedicationPublic)
async def create_medication(
    body: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can add medications")
    row = ElderMedication(
        elder_user_id=current_user.id,
        name=body.name.strip(),
        dosage=(body.dosage or "").strip(),
        schedule_time=(body.schedule_time or "").strip(),
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return await _med_to_public(db, row)


@router.patch("/api/elder/medications/{med_id}", response_model=MedicationPublic)
async def update_medication(
    med_id: int,
    body: MedicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can update medications")
    res = await db.execute(
        select(ElderMedication).where(
            ElderMedication.id == med_id, ElderMedication.elder_user_id == current_user.id
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


@router.delete("/api/elder/medications/{med_id}")
async def delete_medication(
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can delete medications")
    res = await db.execute(
        select(ElderMedication).where(
            ElderMedication.id == med_id, ElderMedication.elder_user_id == current_user.id
        )
    )
    med = res.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    await db.execute(delete(MedicationDoseLog).where(MedicationDoseLog.medication_id == med_id))
    await db.execute(delete(ElderMedication).where(ElderMedication.id == med_id))
    await db.commit()
    return {"ok": True}


@router.post("/api/elder/medications/{med_id}/mark-taken", response_model=MedicationPublic)
async def mark_medication_taken(
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can log medications")
    res = await db.execute(
        select(ElderMedication).where(
            ElderMedication.id == med_id, ElderMedication.elder_user_id == current_user.id
        )
    )
    med = res.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.add(MedicationDoseLog(medication_id=med_id, elder_user_id=current_user.id))
    await db.commit()
    await db.refresh(med)
    return await _med_to_public(db, med)


@router.get("/api/elder/medication-adherence", response_model=MedicationAdherencePublic)
async def get_elder_medication_adherence(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can view adherence")
    raw = await compute_medication_adherence(db, elder_user_id=current_user.id, days=days)
    return MedicationAdherencePublic.model_validate(raw)


# ---- Emergency contacts ----
@router.get("/api/elder/emergency-contacts", response_model=list[EmergencyContactPublic])
async def list_emergency_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can list emergency contacts")
    res = await db.execute(
        select(ElderEmergencyContact)
        .where(ElderEmergencyContact.elder_user_id == current_user.id)
        .order_by(ElderEmergencyContact.sort_order, ElderEmergencyContact.id)
    )
    return list(res.scalars().all())


@router.post("/api/elder/emergency-contacts", response_model=EmergencyContactPublic)
async def create_emergency_contact(
    body: EmergencyContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can add emergency contacts")
    row = ElderEmergencyContact(
        elder_user_id=current_user.id,
        label=body.label.strip(),
        phone=body.phone.strip(),
        sort_order=body.sort_order,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/api/elder/emergency-contacts/{contact_id}", response_model=EmergencyContactPublic)
async def update_emergency_contact(
    contact_id: int,
    body: EmergencyContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can update emergency contacts")
    res = await db.execute(
        select(ElderEmergencyContact).where(
            ElderEmergencyContact.id == contact_id,
            ElderEmergencyContact.elder_user_id == current_user.id,
        )
    )
    row = res.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    if body.label is not None:
        row.label = body.label.strip()
    if body.phone is not None:
        row.phone = body.phone.strip()
    if body.sort_order is not None:
        row.sort_order = body.sort_order
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/api/elder/emergency-contacts/{contact_id}")
async def delete_emergency_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can delete emergency contacts")
    res = await db.execute(
        select(ElderEmergencyContact).where(
            ElderEmergencyContact.id == contact_id,
            ElderEmergencyContact.elder_user_id == current_user.id,
        )
    )
    row = res.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.execute(delete(ElderEmergencyContact).where(ElderEmergencyContact.id == contact_id))
    await db.commit()
    return {"ok": True}


def _tel_href(phone: str) -> str:
    """Sanitize stored phone for mobile click-to-call (digits and leading + only)."""
    raw = (phone or "").strip()
    cleaned = "".join(c for c in raw if c.isdigit() or c == "+")
    return f"tel:{cleaned}" if cleaned else "tel:"


# ---- SOS ----
@limiter.limit("20/minute")
@router.post("/api/elder/sos", response_model=SosTriggerResponse)
async def trigger_sos(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can trigger SOS")
    db.add(ElderSosLog(elder_user_id=current_user.id))
    await alert_sos_pressed(db, elder_user_id=current_user.id)

    res = await db.execute(
        select(ElderEmergencyContact)
        .where(ElderEmergencyContact.elder_user_id == current_user.id)
        .order_by(ElderEmergencyContact.sort_order, ElderEmergencyContact.id)
    )
    contact_rows = list(res.scalars().all())
    emergency_contacts = [
        SosContactDial(
            id=r.id,
            label=r.label,
            phone=r.phone,
            tel_href=_tel_href(r.phone),
        )
        for r in contact_rows
    ]

    await db.commit()
    return SosTriggerResponse(
        ok=True,
        message="Your alert was recorded. If this is a life-threatening emergency, call your local emergency number.",
        emergency_contacts=emergency_contacts,
    )
