from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    topic_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    author_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("community_posts.id"), nullable=False, index=True)
    author_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    parent_comment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("community_comments.id"), nullable=True, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class CommunityPostLike(Base):
    __tablename__ = "community_post_likes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_like_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("community_posts.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)


class CommunityCommentLike(Base):
    __tablename__ = "community_comment_likes"
    __table_args__ = (UniqueConstraint("comment_id", "user_id", name="uq_comment_like_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    comment_id: Mapped[int] = mapped_column(Integer, ForeignKey("community_comments.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)


class CommunityReport(Base):
    """Elder-submitted flags for posts/comments (review in DB or future moderator UI)."""

    __tablename__ = "community_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reporter_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(32), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(64), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
