"""Ordered deletion of user-owned rows before removing the user (SQLite-safe)."""

from __future__ import annotations

from sqlalchemy import delete, exists, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.assessment import Assessment
from app.models.caregiver_alert import CaregiverAlert, CaregiverAlertDismissal
from app.models.caregiver_elder_link import CaregiverElderLink
from app.models.community import (
    CommunityComment,
    CommunityCommentLike,
    CommunityPost,
    CommunityPostLike,
    CommunityReport,
)
from app.models.daily_check_in import DailyCheckIn
from app.models.elder_invite import ElderInvite
from app.models.elder_medication import ElderMedication, MedicationDoseLog
from app.models.elder_profile import ElderProfile
from app.models.emergency_contact import ElderEmergencyContact
from app.models.sos_log import ElderSosLog
from app.models.user import User
from app.models.user_settings import UserSettings


async def _collect_comment_subtree_ids(db: AsyncSession, root_ids: list[int]) -> set[int]:
    ids: set[int] = set(root_ids)
    frontier = list(root_ids)
    while frontier:
        res = await db.execute(
            select(CommunityComment.id).where(CommunityComment.parent_comment_id.in_(frontier))
        )
        nxt = [r[0] for r in res.all()]
        frontier = [i for i in nxt if i not in ids]
        ids.update(frontier)
    return ids


async def _delete_comment_ids_leaf_order(db: AsyncSession, comment_ids: set[int]) -> None:
    if not comment_ids:
        return
    Child = aliased(CommunityComment)
    while True:
        res = await db.execute(
            delete(CommunityComment).where(
                CommunityComment.id.in_(comment_ids),
                ~exists(select(1).where(Child.parent_comment_id == CommunityComment.id)),
            )
        )
        if res.rowcount == 0:
            break


async def _delete_comments_for_posts(db: AsyncSession, post_ids: list[int]) -> None:
    if not post_ids:
        return
    res = await db.execute(select(CommunityComment.id).where(CommunityComment.post_id.in_(post_ids)))
    id_set = {r[0] for r in res.all()}
    if not id_set:
        return
    await db.execute(delete(CommunityCommentLike).where(CommunityCommentLike.comment_id.in_(id_set)))
    await _delete_comment_ids_leaf_order(db, id_set)


async def _delete_user_comment_subtrees(db: AsyncSession, user_id: int) -> None:
    res = await db.execute(select(CommunityComment.id).where(CommunityComment.author_user_id == user_id))
    roots = [r[0] for r in res.all()]
    if not roots:
        return
    id_set = await _collect_comment_subtree_ids(db, roots)
    await db.execute(delete(CommunityCommentLike).where(CommunityCommentLike.comment_id.in_(id_set)))
    await _delete_comment_ids_leaf_order(db, id_set)


async def delete_user_account(db: AsyncSession, user_id: int) -> None:
    uid = user_id

    alert_ids_res = await db.execute(select(CaregiverAlert.id).where(CaregiverAlert.elder_user_id == uid))
    alert_ids = [r[0] for r in alert_ids_res.all()]
    if alert_ids:
        await db.execute(delete(CaregiverAlertDismissal).where(CaregiverAlertDismissal.alert_id.in_(alert_ids)))
    await db.execute(delete(CaregiverAlertDismissal).where(CaregiverAlertDismissal.caregiver_user_id == uid))

    await db.execute(delete(CaregiverAlert).where(CaregiverAlert.elder_user_id == uid))

    await db.execute(delete(CommunityReport).where(CommunityReport.reporter_user_id == uid))

    await db.execute(delete(CommunityCommentLike).where(CommunityCommentLike.user_id == uid))
    await db.execute(delete(CommunityPostLike).where(CommunityPostLike.user_id == uid))

    post_ids_res = await db.execute(select(CommunityPost.id).where(CommunityPost.author_user_id == uid))
    post_ids = [r[0] for r in post_ids_res.all()]
    if post_ids:
        await _delete_comments_for_posts(db, post_ids)
        await db.execute(delete(CommunityPostLike).where(CommunityPostLike.post_id.in_(post_ids)))
        await db.execute(delete(CommunityPost).where(CommunityPost.id.in_(post_ids)))

    await _delete_user_comment_subtrees(db, uid)

    await db.execute(delete(MedicationDoseLog).where(MedicationDoseLog.elder_user_id == uid))
    await db.execute(delete(ElderMedication).where(ElderMedication.elder_user_id == uid))

    await db.execute(delete(DailyCheckIn).where(DailyCheckIn.elder_user_id == uid))
    await db.execute(delete(ElderSosLog).where(ElderSosLog.elder_user_id == uid))
    await db.execute(delete(ElderEmergencyContact).where(ElderEmergencyContact.elder_user_id == uid))

    await db.execute(
        delete(Assessment).where(
            or_(Assessment.elder_user_id == uid, Assessment.created_by_user_id == uid)
        )
    )

    await db.execute(
        delete(CaregiverElderLink).where(
            or_(CaregiverElderLink.caregiver_user_id == uid, CaregiverElderLink.elder_user_id == uid)
        )
    )

    await db.execute(delete(ElderInvite).where(ElderInvite.elder_user_id == uid))
    await db.execute(delete(ElderProfile).where(ElderProfile.user_id == uid))

    await db.execute(delete(UserSettings).where(UserSettings.user_id == uid))
    await db.execute(delete(User).where(User.id == uid))
