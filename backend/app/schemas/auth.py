import re
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: str = Field(..., min_length=5, max_length=150, description="Email address")
    password: str = Field(..., min_length=8, max_length=128, description="Account password")
    organization_name: str = Field(..., min_length=2, max_length=100, description="Wholesale business / stockist name")
    business_type: str = Field(
        default="FMCG Wholesale",
        min_length=2,
        max_length=60,
        description="Type of wholesale business (e.g. FMCG Wholesale, Mandi Trader)"
    )

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        email_regex = r"^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, v):
            raise ValueError("Please provide a valid email address.")
        return v

    @field_validator("name", "organization_name")
    @classmethod
    def sanitize_names(cls, v: str) -> str:
        return v.strip()


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=1, max_length=128)
    remember_me: bool = Field(default=False)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool
    created_at: str


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    business_type: str
    role: str
    created_at: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    organization: OrganizationResponse


class OrganizationMemberResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    role: str
    status: str
    joined_at: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    organization: OrganizationResponse

