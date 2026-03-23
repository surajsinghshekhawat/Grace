from pydantic import BaseModel, Field


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)
