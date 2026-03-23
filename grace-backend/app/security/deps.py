from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import config
from app.db.session import get_db
from app.models.user import User
from app.security.moderation import resolve_is_moderator
from app.security.tokens import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)


def _token_from_request(request: Request, bearer: str | None) -> str | None:
    if bearer:
        return bearer
    return request.cookies.get(config.ACCESS_TOKEN_COOKIE_NAME)


async def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    raw = _token_from_request(request, token)
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(raw)
        subject = payload.get("sub")
        if not subject:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(subject)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_moderator(current_user: User = Depends(get_current_user)) -> User:
    if not resolve_is_moderator(current_user):
        raise HTTPException(status_code=403, detail="Moderator access required")
    return current_user

