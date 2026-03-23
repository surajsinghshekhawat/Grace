from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.elder_profile import ElderProfile
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.me_account import ChangePasswordRequest, DeleteAccountRequest
from app.schemas.profile import ElderProfilePublic, ElderProfileUpsert
from app.schemas.user import UserPublic
from app.schemas.user_settings import UserMePatch, UserSettingsPatch, UserSettingsPublic
from app.security.cookies import clear_auth_cookie
from app.security.deps import get_current_user
from app.security.password import hash_password, verify_password
from app.services.account_delete import delete_user_account
from app.services.user_display import build_user_public


router = APIRouter(tags=["me"])


async def _get_or_create_settings(db: AsyncSession, user_id: int) -> UserSettings:
    res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    row = res.scalar_one_or_none()
    if row is None:
        row = UserSettings(user_id=user_id)
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


@router.get("/api/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)):
    return build_user_public(current_user)


@router.patch("/api/me", response_model=UserPublic)
async def patch_me(
    body: UserMePatch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name.strip()
        await db.commit()
        await db.refresh(current_user)
    return build_user_public(current_user)


@router.post("/api/me/change-password", status_code=204)
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password")
    current_user.password_hash = hash_password(body.new_password)
    await db.commit()


@router.post("/api/me/delete-account", status_code=204)
async def delete_account(
    response: Response,
    body: DeleteAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Password is incorrect")
    uid = current_user.id
    await delete_user_account(db, uid)
    await db.commit()
    clear_auth_cookie(response)


@router.get("/api/me/settings", response_model=UserSettingsPublic)
async def get_my_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = await _get_or_create_settings(db, current_user.id)
    return UserSettingsPublic(
        large_text=s.large_text,
        high_contrast=s.high_contrast,
        checkin_reminders=s.checkin_reminders,
        language=s.language,
    )


@router.patch("/api/me/settings", response_model=UserSettingsPublic)
async def patch_my_settings(
    body: UserSettingsPatch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = await _get_or_create_settings(db, current_user.id)
    if body.large_text is not None:
        s.large_text = body.large_text
    if body.high_contrast is not None:
        s.high_contrast = body.high_contrast
    if body.checkin_reminders is not None:
        s.checkin_reminders = body.checkin_reminders
    if body.language is not None:
        s.language = body.language.strip() or "English"
    await db.commit()
    await db.refresh(s)
    return UserSettingsPublic(
        large_text=s.large_text,
        high_contrast=s.high_contrast,
        checkin_reminders=s.checkin_reminders,
        language=s.language,
    )


@router.get("/api/me/elder-profile", response_model=ElderProfilePublic | None)
async def get_elder_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders have an elder profile")
    res = await db.execute(select(ElderProfile).where(ElderProfile.user_id == current_user.id))
    return res.scalar_one_or_none()


@router.put("/api/me/elder-profile", response_model=ElderProfilePublic)
async def upsert_elder_profile(
    body: ElderProfileUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "elder":
        raise HTTPException(status_code=403, detail="Only elders have an elder profile")

    res = await db.execute(select(ElderProfile).where(ElderProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if profile is None:
        profile = ElderProfile(user_id=current_user.id)
        db.add(profile)

    profile.age_range = body.age_range
    profile.conditions_summary = body.conditions_summary
    profile.medications_summary = body.medications_summary

    await db.commit()
    await db.refresh(profile)
    return profile

