import re
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


INDIAN_PHONE_REGEX = re.compile(r"^(?:\+91|91)?[6-9]\d{9}$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
PINCODE_REGEX = re.compile(r"^[1-9][0-9]{5}$")


class DeliveryAddress(BaseModel):
    """Delivery address model for Kirana store locations."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:10])
    label: str = Field("Main Shop", max_length=50, description="Address label (e.g., Shop Front, Godown 1)")
    address_line1: str = Field(..., min_length=3, max_length=150)
    address_line2: Optional[str] = Field(None, max_length=150)
    city: str = Field(..., min_length=2, max_length=60)
    state: str = Field(..., min_length=2, max_length=60)
    pin_code: str = Field(..., description="6-digit Indian Postal PIN code")
    is_default: bool = Field(False)

    @field_validator("pin_code")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        cleaned = v.strip()
        if not PINCODE_REGEX.match(cleaned):
            raise ValueError("Invalid 6-digit Indian PIN code")
        return cleaned


class RetailerBase(BaseModel):
    """Base schema for Kirana store retailer accounts."""
    store_name: str = Field(..., min_length=2, max_length=120, description="Registered or trade store name")
    owner_name: str = Field(..., min_length=2, max_length=100, description="Kirana proprietor or contact person")
    primary_phone: str = Field(..., description="10-digit Indian mobile number for caller ID matching")
    alternate_phone: Optional[str] = Field(None, description="Optional secondary phone number")
    gstin: Optional[str] = Field(None, description="15-character Indian Goods and Services Tax Identification Number")
    credit_limit: float = Field(0.0, ge=0.0, description="Approved wholesale credit limit in INR")
    current_balance: float = Field(0.0, ge=0.0, description="Outstanding balance in INR")
    preferred_language: str = Field("hi-IN", description="Preferred spoken language (hi-IN, te-IN, en-IN)")
    notes: Optional[str] = Field(None, max_length=1000, description="Special distributor notes or delivery instructions")
    delivery_addresses: List[DeliveryAddress] = Field(default_factory=list)
    is_active: bool = Field(True)

    @field_validator("primary_phone")
    @classmethod
    def validate_primary_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        if len(digits) != 10 or not digits[0] in "6789":
            raise ValueError("Primary phone must be a valid 10-digit Indian mobile number starting with 6-9")
        return digits

    @field_validator("alternate_phone")
    @classmethod
    def validate_alternate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        digits = re.sub(r"\D", "", v)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        if len(digits) != 10 or not digits[0] in "6789":
            raise ValueError("Alternate phone must be a valid 10-digit Indian mobile number starting with 6-9")
        return digits

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip().upper()
        if not GSTIN_REGEX.match(cleaned):
            raise ValueError("Invalid GSTIN format (e.g. 36AAACS1429B1Z0)")
        return cleaned


class RetailerCreate(RetailerBase):
    """Payload to register a new retailer account."""
    pass


class RetailerUpdate(BaseModel):
    """Payload to update an existing retailer account."""
    store_name: Optional[str] = Field(None, min_length=2, max_length=120)
    owner_name: Optional[str] = Field(None, min_length=2, max_length=100)
    primary_phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    gstin: Optional[str] = None
    credit_limit: Optional[float] = Field(None, ge=0.0)
    current_balance: Optional[float] = Field(None, ge=0.0)
    preferred_language: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=1000)
    delivery_addresses: Optional[List[DeliveryAddress]] = None
    is_active: Optional[bool] = None

    @field_validator("primary_phone")
    @classmethod
    def validate_primary_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        digits = re.sub(r"\D", "", v)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        if len(digits) != 10 or not digits[0] in "6789":
            raise ValueError("Primary phone must be a valid 10-digit Indian mobile number")
        return digits

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        cleaned = v.strip().upper()
        if not GSTIN_REGEX.match(cleaned):
            raise ValueError("Invalid GSTIN format")
        return cleaned


class RetailerResponse(RetailerBase):
    """Public representation of a retailer account."""
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime


class RetailerListResponse(BaseModel):
    """Paginated list of registered retailers."""
    items: List[RetailerResponse]
    total: int
    page: int
    limit: int
    pages: int
    total_credit_allocated: float
