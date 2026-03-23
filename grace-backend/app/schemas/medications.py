from datetime import datetime

from pydantic import BaseModel, Field


class MedicationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dosage: str = Field(default="", max_length=255)
    schedule_time: str = Field(default="", max_length=64)


class MedicationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    dosage: str | None = Field(default=None, max_length=255)
    schedule_time: str | None = Field(default=None, max_length=64)
    sort_order: int | None = None


class MedicationPublic(BaseModel):
    id: int
    elder_user_id: int
    name: str
    dosage: str
    schedule_time: str
    sort_order: int
    taken_today: bool
    last_taken_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
