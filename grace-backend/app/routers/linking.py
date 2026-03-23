from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.caregiver_elder_link import CaregiverElderLink
from app.models.elder_invite import ElderInvite
from app.models.user import User
from app.schemas.linking import InviteCreateResponse, LinkElderRequest, LinkedElderPublic
from app.security.deps import get_current_user


router = APIRouter(tags=["linking"])


def _new_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("/api/elder/invite", response_model=InviteCreateResponse)
async def create_invite(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders can create an invite")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)

    # Try a few times for unique code
    invite = None
    for _ in range(10):
        code = _new_code()
        invite = ElderInvite(elder_user_id=current_user.id, code=code, expires_at=expires_at)
        db.add(invite)
        try:
            await db.commit()
            await db.refresh(invite)
            break
        except IntegrityError:
            await db.rollback()
            invite = None
            continue

    if invite is None:
        raise HTTPException(status_code=500, detail="Could not generate invite code")

    return InviteCreateResponse(code=invite.code, expires_at=invite.expires_at)


@router.post("/api/caregiver/link-elder", response_model=LinkedElderPublic)
async def link_elder(
    body: LinkElderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can link an elder")

    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(ElderInvite).where(
            and_(
                ElderInvite.code == body.code.strip().upper(),
                ElderInvite.used_at.is_(None),
                ElderInvite.expires_at > now,
            )
        )
    )
    invite = res.scalar_one_or_none()
    if invite is None:
        raise HTTPException(status_code=400, detail="Invalid or expired invite code")

    # Ensure elder exists
    res = await db.execute(select(User).where(User.id == invite.elder_user_id))
    elder = res.scalar_one_or_none()
    if elder is None:
        raise HTTPException(status_code=400, detail="Invite elder not found")
    if elder.role != "elder":
        raise HTTPException(status_code=400, detail="Invite is not for an elder account")

    link = CaregiverElderLink(caregiver_user_id=current_user.id, elder_user_id=elder.id)
    db.add(link)
    invite.used_at = now
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already linked")

    return LinkedElderPublic(elder_user_id=elder.id, elder_name=elder.name, linked_at=link.created_at)


@router.get("/api/caregiver/linked-elders", response_model=list[LinkedElderPublic])
async def list_linked_elders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can list linked elders")

    res = await db.execute(
        select(CaregiverElderLink, User)
        .join(User, User.id == CaregiverElderLink.elder_user_id)
        .where(CaregiverElderLink.caregiver_user_id == current_user.id)
        .order_by(CaregiverElderLink.created_at.desc())
    )
    out: list[LinkedElderPublic] = []
    for link, elder in res.all():
        out.append(
            LinkedElderPublic(
                elder_user_id=elder.id,
                elder_name=elder.name,
                linked_at=link.created_at,
            )
        )
    return out

