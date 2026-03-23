"""
JSON export of account-held data (portability / transparency): elder and caregiver bundles.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.caregiver_alert import CaregiverAlert, CaregiverAlertDismissal
from app.models.caregiver_elder_link import CaregiverElderLink
from app.models.community import CommunityComment, CommunityPost, CommunityReport
from app.models.daily_check_in import DailyCheckIn
from app.models.elder_medication import ElderMedication, MedicationDoseLog
from app.models.elder_profile import ElderProfile
from app.models.emergency_contact import ElderEmergencyContact
from app.models.sos_log import ElderSosLog
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.assessments import assessment_row_to_public
from app.schemas.user import UserPublic
from app.security.deps import get_current_user
from app.security.moderation import resolve_is_moderator


router = APIRouter(tags=["me"])


def _dt_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.isoformat()


def _user_account_dict(user: User) -> dict:
    base = UserPublic.model_validate(user)
    return base.model_copy(update={"is_moderator": resolve_is_moderator(user)}).model_dump(mode="json")


def _assessment_export_dict(a: Assessment) -> dict:
    pub = assessment_row_to_public(a).model_dump(mode="json")
    pub["answers"] = a.answers
    return pub


@router.get("/api/me/data-export")
async def export_my_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Full JSON snapshot for the signed-in **elder** (assessments with answers, check-ins,
    health rows, community content they authored, reports they filed).
    Caregivers should use **GET /api/me/caregiver-data-export**.
    """
    if current_user.role != "elder":
        raise HTTPException(
            status_code=403,
            detail="Data export is only available for elder accounts.",
        )

    uid = current_user.id

    settings_row = (
        await db.execute(select(UserSettings).where(UserSettings.user_id == uid))
    ).scalar_one_or_none()

    profile = (
        await db.execute(select(ElderProfile).where(ElderProfile.user_id == uid))
    ).scalar_one_or_none()

    assessments = list(
        (
            await db.execute(
                select(Assessment)
                .where(Assessment.elder_user_id == uid)
                .order_by(Assessment.created_at.desc())
            )
        ).scalars().all()
    )

    check_ins = list(
        (
            await db.execute(
                select(DailyCheckIn)
                .where(DailyCheckIn.elder_user_id == uid)
                .order_by(DailyCheckIn.created_at.desc())
            )
        ).scalars().all()
    )

    medications = list(
        (
            await db.execute(
                select(ElderMedication)
                .where(ElderMedication.elder_user_id == uid)
                .order_by(ElderMedication.sort_order, ElderMedication.id)
            )
        ).scalars().all()
    )

    dose_logs = list(
        (
            await db.execute(
                select(MedicationDoseLog)
                .where(MedicationDoseLog.elder_user_id == uid)
                .order_by(MedicationDoseLog.taken_at.desc())
            )
        ).scalars().all()
    )

    contacts = list(
        (
            await db.execute(
                select(ElderEmergencyContact)
                .where(ElderEmergencyContact.elder_user_id == uid)
                .order_by(ElderEmergencyContact.sort_order, ElderEmergencyContact.id)
            )
        ).scalars().all()
    )

    sos_logs = list(
        (
            await db.execute(
                select(ElderSosLog)
                .where(ElderSosLog.elder_user_id == uid)
                .order_by(ElderSosLog.created_at.desc())
            )
        ).scalars().all()
    )

    links = list(
        (
            await db.execute(
                select(CaregiverElderLink).where(CaregiverElderLink.elder_user_id == uid)
            )
        ).scalars().all()
    )

    posts = list(
        (
            await db.execute(
                select(CommunityPost).where(CommunityPost.author_user_id == uid).order_by(CommunityPost.created_at.desc())
            )
        ).scalars().all()
    )

    comments = list(
        (
            await db.execute(
                select(CommunityComment)
                .where(CommunityComment.author_user_id == uid)
                .order_by(CommunityComment.created_at.desc())
            )
        ).scalars().all()
    )

    reports = list(
        (
            await db.execute(
                select(CommunityReport)
                .where(CommunityReport.reporter_user_id == uid)
                .order_by(CommunityReport.created_at.desc())
            )
        ).scalars().all()
    )

    export = {
        "export_version": 1,
        "export_kind": "elder",
        "exported_at": _dt_iso(datetime.now(timezone.utc)),
        "disclaimer": "Grace data export for your records. Not a clinical record. Verify contents before sharing.",
        "account": _user_account_dict(current_user),
        "settings": (
            {
                "large_text": settings_row.large_text,
                "high_contrast": settings_row.high_contrast,
                "checkin_reminders": settings_row.checkin_reminders,
                "language": settings_row.language,
            }
            if settings_row
            else None
        ),
        "elder_profile": (
            {
                "age_range": profile.age_range,
                "conditions_summary": profile.conditions_summary,
                "medications_summary": profile.medications_summary,
                "created_at": _dt_iso(profile.created_at),
                "updated_at": _dt_iso(profile.updated_at),
            }
            if profile
            else None
        ),
        "linked_caregiver_user_ids": [
            {"caregiver_user_id": link.caregiver_user_id, "linked_at": _dt_iso(link.created_at)} for link in links
        ],
        "assessments": [_assessment_export_dict(a) for a in assessments],
        "daily_check_ins": [
            {
                "id": c.id,
                "mood": c.mood,
                "energy": c.energy,
                "sleep": c.sleep,
                "appetite": c.appetite,
                "pain": c.pain,
                "loneliness": c.loneliness,
                "created_at": _dt_iso(c.created_at),
            }
            for c in check_ins
        ],
        "medications": [
            {
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "schedule_time": m.schedule_time,
                "sort_order": m.sort_order,
                "created_at": _dt_iso(m.created_at),
            }
            for m in medications
        ],
        "medication_dose_logs": [
            {
                "id": log.id,
                "medication_id": log.medication_id,
                "taken_at": _dt_iso(log.taken_at),
            }
            for log in dose_logs
        ],
        "emergency_contacts": [
            {
                "id": x.id,
                "label": x.label,
                "phone": x.phone,
                "sort_order": x.sort_order,
                "created_at": _dt_iso(x.created_at),
            }
            for x in contacts
        ],
        "sos_events": [{"id": s.id, "created_at": _dt_iso(s.created_at)} for s in sos_logs],
        "community_posts": [
            {
                "id": p.id,
                "topic_id": p.topic_id,
                "body": p.body,
                "created_at": _dt_iso(p.created_at),
            }
            for p in posts
        ],
        "community_comments": [
            {
                "id": c.id,
                "post_id": c.post_id,
                "parent_comment_id": c.parent_comment_id,
                "body": c.body,
                "created_at": _dt_iso(c.created_at),
            }
            for c in comments
        ],
        "community_reports_filed": [
            {
                "id": r.id,
                "target_type": r.target_type,
                "target_id": r.target_id,
                "reason": r.reason,
                "details": r.details,
                "status": r.status,
                "created_at": _dt_iso(r.created_at),
            }
            for r in reports
        ],
    }

    return export


@router.get("/api/me/caregiver-data-export")
async def export_caregiver_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    JSON snapshot for the signed-in **caregiver**: account, settings, linked elders,
    alerts for those elders, alert dismissals, and assessments **submitted by this caregiver**
    on behalf of linked elders (includes answers).
    """
    if current_user.role != "caregiver":
        raise HTTPException(
            status_code=403,
            detail="Caregiver data export is only available for caregiver accounts.",
        )

    uid = current_user.id

    settings_row = (
        await db.execute(select(UserSettings).where(UserSettings.user_id == uid))
    ).scalar_one_or_none()

    link_rows = list(
        (
            await db.execute(
                select(CaregiverElderLink, User)
                .join(User, User.id == CaregiverElderLink.elder_user_id)
                .where(CaregiverElderLink.caregiver_user_id == uid)
                .order_by(CaregiverElderLink.created_at.desc())
            )
        ).all()
    )

    linked_elders = [
        {
            "elder_user_id": elder.id,
            "elder_name": elder.name,
            "linked_at": _dt_iso(link.created_at),
        }
        for link, elder in link_rows
    ]
    elder_ids = [row["elder_user_id"] for row in linked_elders]

    alerts: list[dict] = []
    if elder_ids:
        alert_rows = list(
            (
                await db.execute(
                    select(CaregiverAlert)
                    .where(CaregiverAlert.elder_user_id.in_(elder_ids))
                    .order_by(CaregiverAlert.created_at.desc())
                )
            ).scalars().all()
        )
        for a in alert_rows:
            alerts.append(
                {
                    "id": a.id,
                    "elder_user_id": a.elder_user_id,
                    "kind": a.kind,
                    "severity": a.severity,
                    "title": a.title,
                    "message": a.message,
                    "context_json": a.context_json,
                    "created_at": _dt_iso(a.created_at),
                }
            )

    dismissal_rows = list(
        (
            await db.execute(
                select(CaregiverAlertDismissal)
                .where(CaregiverAlertDismissal.caregiver_user_id == uid)
                .order_by(CaregiverAlertDismissal.dismissed_at.desc())
            )
        ).scalars().all()
    )
    alert_dismissals = [
        {
            "id": d.id,
            "alert_id": d.alert_id,
            "dismissed_at": _dt_iso(d.dismissed_at),
        }
        for d in dismissal_rows
    ]

    cg_assessments = list(
        (
            await db.execute(
                select(Assessment)
                .where(Assessment.created_by_user_id == uid)
                .order_by(Assessment.created_at.desc())
            )
        ).scalars().all()
    )

    return {
        "export_version": 1,
        "export_kind": "caregiver",
        "exported_at": _dt_iso(datetime.now(timezone.utc)),
        "disclaimer": "Grace caregiver data export for your records. Includes alerts and assessments you submitted "
        "for linked elders. Not a clinical record. Verify contents before sharing.",
        "account": _user_account_dict(current_user),
        "settings": (
            {
                "large_text": settings_row.large_text,
                "high_contrast": settings_row.high_contrast,
                "checkin_reminders": settings_row.checkin_reminders,
                "language": settings_row.language,
            }
            if settings_row
            else None
        ),
        "linked_elders": linked_elders,
        "caregiver_alerts_for_linked_elders": alerts,
        "alert_dismissals": alert_dismissals,
        "assessments_submitted_as_caregiver": [_assessment_export_dict(a) for a in cg_assessments],
    }
