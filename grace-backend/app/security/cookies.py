from __future__ import annotations

from fastapi import Response

from app import config


def set_auth_cookie(response: Response, token: str) -> None:
    max_age = int(config.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    prod = config.is_production()
    response.set_cookie(
        key=config.ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=max_age,
        secure=prod,
        samesite="strict" if prod else "lax",
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=config.ACCESS_TOKEN_COOKIE_NAME, path="/")
