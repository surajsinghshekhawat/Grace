from datetime import datetime

from pydantic import BaseModel


class UserPublic(BaseModel):
    id: int
    email_or_phone: str
    role: str
    name: str
    created_at: datetime
    is_moderator: bool = False

    class Config:
        from_attributes = True

