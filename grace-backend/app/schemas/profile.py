from datetime import datetime

from pydantic import BaseModel, Field


class ElderProfileUpsert(BaseModel):
    age_range: str | None = Field(default=None, max_length=64)
    conditions_summary: str | None = Field(default=None, max_length=2000)
    medications_summary: str | None = Field(default=None, max_length=2000)


class ElderProfilePublic(BaseModel):
    id: int
    user_id: int
    age_range: str | None
    conditions_summary: str | None
    medications_summary: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

