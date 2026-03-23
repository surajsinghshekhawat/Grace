from datetime import datetime

from pydantic import BaseModel, Field


class DailyCheckInCreate(BaseModel):
    mood: int = Field(ge=1, le=5)
    energy: int = Field(ge=1, le=5)
    sleep: int = Field(ge=1, le=5)
    appetite: int = Field(ge=1, le=5)
    pain: int = Field(ge=1, le=5)
    loneliness: int = Field(ge=1, le=5)


class DailyCheckInPublic(DailyCheckInCreate):
    id: int
    elder_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

