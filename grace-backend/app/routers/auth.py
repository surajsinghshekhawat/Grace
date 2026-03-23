from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import config
from app.db.session import get_db
from app.limiter import limiter
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.schemas.user import UserPublic
from app.security.cookies import clear_auth_cookie, set_auth_cookie
from app.security.password import hash_password, verify_password
from app.security.tokens import create_access_token
from app.services.mail import send_email
from app.services.user_display import build_user_public

router = APIRouter(tags=["auth"])

_RESET_TTL = timedelta(hours=1)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _is_probably_email(s: str) -> bool:
    return "@" in s and "." in s.split("@")[-1]


@limiter.limit("20/minute")
@router.post("/api/register", response_model=UserPublic)
async def register(request: Request, response: Response, req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = User(
        email_or_phone=req.email_or_phone.strip(),
        password_hash=hash_password(req.password),
        role=req.role,
        name=req.name.strip(),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Account already exists")
    await db.refresh(user)
    token = create_access_token(str(user.id))
    set_auth_cookie(response, token)
    return build_user_public(user)


@limiter.limit("30/minute")
@router.post("/api/login", response_model=UserPublic)
async def login(request: Request, response: Response, req: LoginRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email_or_phone == req.email_or_phone.strip()))
    user = res.scalar_one_or_none()
    if user is None or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    set_auth_cookie(response, token)
    return build_user_public(user)


@router.post("/api/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}


@limiter.limit("5/hour")
@router.post("/api/auth/forgot-password")
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Always 200 to avoid account enumeration. Sends email only when SMTP is set and identifier looks like email."""
    ident = body.email_or_phone.strip()
    res = await db.execute(select(User).where(User.email_or_phone == ident))
    user = res.scalar_one_or_none()

    if user is None or not _is_probably_email(ident):
        return {"ok": True}

    if not config.smtp_configured():
        return {"ok": True, "email_sent": False}

    raw = secrets.token_urlsafe(32)
    th = _hash_token(raw)
    exp = datetime.now(timezone.utc) + _RESET_TTL
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    db.add(PasswordResetToken(user_id=user.id, token_hash=th, expires_at=exp))
    await db.commit()

    link = f"{config.PUBLIC_APP_URL}/auth/reset?token={raw}"
    subj = "Reset your Grace password"
    text = (
        f"Hi {user.name},\n\n"
        f"We received a request to reset your Grace password. Use this link (valid 1 hour):\n{link}\n\n"
        "If you did not ask for this, you can ignore this email.\n"
    )
    send_email(ident, subj, text)
    return {"ok": True, "email_sent": True}


@limiter.limit("30/minute")
@router.post("/api/auth/reset-password", response_model=UserPublic)
async def reset_password(
    request: Request,
    response: Response,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    th = _hash_token(body.token.strip())
    res = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == th,
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    row = res.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    ures = await db.execute(select(User).where(User.id == row.user_id))
    user = ures.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid reset link")

    user.password_hash = hash_password(body.new_password)
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    set_auth_cookie(response, token)
    return build_user_public(user)
