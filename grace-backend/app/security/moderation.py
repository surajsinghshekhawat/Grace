"""Moderator access: `users.is_moderator` and/or env `GRACE_MODERATOR_IDS` (comma-separated user IDs)."""

from __future__ import annotations

import os

from app.models.user import User


def moderator_user_ids() -> frozenset[int]:
    raw = os.environ.get("GRACE_MODERATOR_IDS", "").strip()
    if not raw:
        return frozenset()
    out: set[int] = set()
    for part in raw.replace(" ", "").split(","):
        if part.isdigit():
            out.add(int(part))
    return frozenset(out)


def resolve_is_moderator(user: User) -> bool:
    """True if the user row is flagged moderator or their id is listed in GRACE_MODERATOR_IDS."""
    if bool(getattr(user, "is_moderator", False)):
        return True
    uid = getattr(user, "id", None)
    if uid is None:
        return False
    return uid in moderator_user_ids()
