from datetime import datetime

from pydantic import BaseModel, Field


class EmergencyContactCreate(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=64)
    sort_order: int = 0


class EmergencyContactUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=1, max_length=64)
    sort_order: int | None = None


class EmergencyContactPublic(BaseModel):
    id: int
    elder_user_id: int
    label: str
    phone: str
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class SosContactDial(BaseModel):
    """Emergency contact row for SOS UI (click-to-call)."""

    id: int
    label: str
    phone: str
    tel_href: str


class SosTriggerResponse(BaseModel):
    ok: bool = True
    message: str
    emergency_contacts: list[SosContactDial]
