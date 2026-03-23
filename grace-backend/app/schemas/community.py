from __future__ import annotations

from datetime import datetime

from typing import Literal

from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    parent_comment_id: int | None = None


class CommunityReportCreate(BaseModel):
    target_type: Literal["post", "comment"]
    target_id: int = Field(ge=1)
    reason: str = Field(min_length=3, max_length=80)
    details: str | None = Field(None, max_length=2000)


class CommunityReportListItem(BaseModel):
    id: int
    reporter_user_id: int
    reporter_name: str
    target_type: Literal["post", "comment"]
    target_id: int
    target_post_id: int
    target_preview: str
    reason: str
    details: str | None
    status: str
    created_at: datetime


class CommunityReportStatusPatch(BaseModel):
    status: Literal["pending", "reviewed", "dismissed"]


class CommentNode(BaseModel):
    id: int
    post_id: int
    author_user_id: int
    author_name: str
    parent_comment_id: int | None
    body: str
    created_at: datetime
    like_count: int
    liked_by_me: bool
    replies: list["CommentNode"] = []

    class Config:
        from_attributes = True


class PostPublic(BaseModel):
    id: int
    topic_id: str
    topic_title: str | None = None
    author_user_id: int
    author_name: str
    body: str
    created_at: datetime
    like_count: int
    liked_by_me: bool
    comment_count: int
    comments: list[CommentNode] = []

    class Config:
        from_attributes = True


CommentNode.model_rebuild()
