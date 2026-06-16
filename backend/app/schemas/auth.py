"""Schemas Pydantic dos endpoints de autenticação."""
from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    cpf: Optional[str] = Field(default=None, min_length=11, max_length=14)
    birth_date: Optional[date] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    accept_terms: bool

    @field_validator("accept_terms")
    @classmethod
    def _terms_required(cls, v: bool) -> bool:
        if not v:
            raise ValueError("É preciso aceitar os Termos de Uso e a Política de Privacidade.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)


class CompleteProfileRequest(BaseModel):
    cpf: str = Field(min_length=11, max_length=14)
    birth_date: date
    phone: str = Field(min_length=8, max_length=20)
    accept_terms: bool

    @field_validator("accept_terms")
    @classmethod
    def _terms_required(cls, v: bool) -> bool:
        if not v:
            raise ValueError("É preciso aceitar os Termos de Uso e a Política de Privacidade.")
        return v


class RecoverRequest(BaseModel):
    email: EmailStr
    channel: Literal["email", "sms"] = "email"


class RecoverVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class RecoverResetRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)
    new_password: str = Field(min_length=8, max_length=128)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    needs_completion: bool = False


class RecoverChannelResponse(BaseModel):
    channel: Literal["email", "sms"]
    delivered: bool
    message: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    cpf: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    role: str
    has_driver: bool = False
    driver_status: Optional[str] = None
    fare_category_slug: Optional[str] = None
