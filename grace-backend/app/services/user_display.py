from __future__ import annotations

from app.models.user import User
from app.schemas.user import UserPublic
from app.security.moderation import resolve_is_moderator


def build_user_public(user: User) -> UserPublic:
    base = UserPublic.model_validate(user)
    return base.model_copy(update={"is_moderator": resolve_is_moderator(user)})
