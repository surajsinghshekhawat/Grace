from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

