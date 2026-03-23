"""Add users.is_moderator

Revision ID: 20250306_01
Revises:
Create Date: 2025-03-06

Idempotent for SQLite: skips add_column if column already exists (e.g. after SQLAlchemy create_all).
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "20250306_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if not insp.has_table("users"):
        # Fresh DB: run the app once (create_all) or stamp after tables exist.
        return
    cols = [c["name"] for c in insp.get_columns("users")]
    if "is_moderator" in cols:
        return
    op.add_column(
        "users",
        sa.Column("is_moderator", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if not insp.has_table("users"):
        return
    cols = [c["name"] for c in insp.get_columns("users")]
    if "is_moderator" not in cols:
        return
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("is_moderator")
