from pydantic import BaseModel, Field


class UserSettingsPublic(BaseModel):
    large_text: bool = False
    high_contrast: bool = False
    checkin_reminders: bool = True
    language: str = "English"


class UserSettingsPatch(BaseModel):
    large_text: bool | None = None
    high_contrast: bool | None = None
    checkin_reminders: bool | None = None
    language: str | None = Field(default=None, max_length=64)


class UserMePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
