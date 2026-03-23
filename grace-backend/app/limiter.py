"""Shared SlowAPI limiter (mounted on app.state in main). Redis when REDIS_URL is set."""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app import config

_storage = config.REDIS_URL if config.REDIS_URL else "memory://"
limiter = Limiter(key_func=get_remote_address, storage_uri=_storage)
