import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


E164_PHONE_REGEX = re.compile(r"^\+[1-9]\d{1,14}$")


class VoicePersonaConfig(BaseModel):
    """Configuration for AI Voice persona and fallback routing."""
    greeting_name: Optional[str] = Field(None, max_length=120, description="Business greeting name")
    default_language: str = Field("hi-IN", description="Default spoken language (hi-IN, te-IN, en-IN)")
    agent_gender: str = Field("FEMALE", description="Voice agent gender (FEMALE or MALE)")
    fallback_forward_phone: Optional[str] = Field(None, description="Human staff phone for escalations in E.164 format")

    @field_validator("fallback_forward_phone")
    @classmethod
    def validate_fallback_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = v.strip()
        if not E164_PHONE_REGEX.match(cleaned):
            # Try formatting Indian 10-digit number
            digits = re.sub(r"\D", "", cleaned)
            if len(digits) == 10 and digits[0] in "6789":
                return f"+91{digits}"
            elif len(digits) == 12 and digits.startswith("91"):
                return f"+{digits}"
            raise ValueError("Fallback phone must be a valid E.164 phone number (e.g. +919876543210)")
        return cleaned


class PhoneConfigUpdate(BaseModel):
    """Payload to configure or update the organization's Twilio phone configuration."""
    phone_number: str = Field(..., description="Twilio assigned phone number in E.164 format (e.g. +14155552671 or +91...)")
    voice_persona: Optional[VoicePersonaConfig] = None
    is_active: bool = Field(True, description="Whether this number is active for incoming voice streams")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if not E164_PHONE_REGEX.match(cleaned):
            # Normalize Indian 10-digit if applicable
            digits = re.sub(r"\D", "", cleaned)
            if len(digits) == 10 and digits[0] in "6789":
                return f"+91{digits}"
            elif len(digits) == 12 and digits.startswith("91"):
                return f"+{digits}"
            raise ValueError("Phone number must be in E.164 format (e.g. +14155552671 or +919876543210)")
        return cleaned


class PhoneConfigResponse(BaseModel):
    """Public representation of active organization telephony configuration."""
    organization_id: str
    provider: str = "TWILIO"
    phone_number: str
    is_active: bool
    voice_persona: VoicePersonaConfig
    webhook_url: str
    websocket_url: str
    india_voice_notice: str
    trial_notice: str
    created_at: datetime
    updated_at: datetime


class CallEventResponse(BaseModel):
    """Audit log item representing a specific call lifecycle event."""
    id: str
    call_id: str
    event_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class CallResponse(BaseModel):
    """Summary of an inbound phone call handled by the platform."""
    id: str
    call_sid: str
    organization_id: str
    from_phone: str
    to_phone: str
    retailer_id: Optional[str] = None
    retailer_name: Optional[str] = "Unknown Retailer"
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    call_outcome: Optional[str] = "IN_PROGRESS"
    recording_url: Optional[str] = None
    created_at: datetime


class CallDetailResponse(CallResponse):
    """Detailed call history item with chronological turn events."""
    events: List[CallEventResponse] = Field(default_factory=list)


class CallListResponse(BaseModel):
    """Paginated list of inbound calls for an organization."""
    items: List[CallResponse]
    total: int
    page: int
    limit: int
    pages: int
    total_calls_today: int = 0
    active_calls_count: int = 0


class TwilioConnectionTestResponse(BaseModel):
    """Response returned when validating Twilio account credentials."""
    connected: bool
    provider: str = "twilio"
    status: str  # "CONNECTED" | "DISCONNECTED"
    notice: Optional[str] = None
