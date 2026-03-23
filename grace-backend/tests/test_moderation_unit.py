from __future__ import annotations

import os
from types import SimpleNamespace

import pytest

from app.security.moderation import moderator_user_ids, resolve_is_moderator


def test_moderator_user_ids_parses_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("GRACE_MODERATOR_IDS", " 1, 42 , 99 ")
    assert moderator_user_ids() == frozenset({1, 42, 99})


def test_resolve_is_moderator_db_flag():
    u = SimpleNamespace(id=7, is_moderator=True)
    assert resolve_is_moderator(u) is True


def test_resolve_is_moderator_env_list(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("GRACE_MODERATOR_IDS", "7")
    u = SimpleNamespace(id=7, is_moderator=False)
    assert resolve_is_moderator(u) is True


def test_resolve_not_moderator():
    u = SimpleNamespace(id=1, is_moderator=False)
    old = os.environ.pop("GRACE_MODERATOR_IDS", None)
    try:
        assert resolve_is_moderator(u) is False
    finally:
        if old is not None:
            os.environ["GRACE_MODERATOR_IDS"] = old
