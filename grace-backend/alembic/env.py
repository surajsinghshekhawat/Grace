"""Alembic migration env — sync SQLite URL matches app.config.DB_PATH."""

from __future__ import annotations

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# grace-backend/
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.config import DB_PATH  # noqa: E402
from app.db.base import Base  # noqa: E402

# Import models so Base.metadata is complete (same set as init_db)
from app.models import assessment  # noqa: F401, E402
from app.models import caregiver_alert  # noqa: F401, E402
from app.models import caregiver_elder_link  # noqa: F401, E402
from app.models import community  # noqa: F401, E402
from app.models import daily_check_in  # noqa: F401, E402
from app.models import elder_invite  # noqa: F401, E402
from app.models import elder_medication  # noqa: F401, E402
from app.models import elder_profile  # noqa: F401, E402
from app.models import emergency_contact  # noqa: F401, E402
from app.models import sos_log  # noqa: F401, E402
from app.models import user  # noqa: F401, E402
from app.models import user_settings  # noqa: F401, E402

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    return f"sqlite:///{DB_PATH.as_posix()}"


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    section = config.get_section(config.config_ini_section) or {}
    section["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(section, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
