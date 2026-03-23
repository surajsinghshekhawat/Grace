from datetime import datetime

from pydantic import BaseModel, Field


class InviteCreateResponse(BaseModel):
    code: str
    expires_at: datetime


class LinkElderRequest(BaseModel):
    code: str = Field(min_length=4, max_length=32)


class LinkedElderPublic(BaseModel):
    elder_user_id: int
    elder_name: str
    linked_at: datetime

