from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    email_or_phone: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(pattern="^(elder|caregiver)$")
    name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email_or_phone: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    """Legacy shape; login/register now return UserPublic + httpOnly cookie."""

    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email_or_phone: str = Field(min_length=3, max_length=255)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=256)
    new_password: str = Field(min_length=6, max_length=128)
