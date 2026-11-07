"""
Vyapaar सेतु — Telephony Pydantic Schemas.
Defines schemas for phone number provisioning, connection tests, call history, and event audits.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PhoneConfigUpdate(BaseModel):
    """Payload to configure or update the organization's dedicated Vobiz business phone number."""
    phone_number: str = Field(..., min_length=10, max_length=20, description="Virtual business phone number (e.g. +918012345678 or 10-digit mobile)")
    is_active: bool = Field(default=True, description="Whether this number is accepting incoming calls")
    display_label: Optional[str] = Field(default="Primary Wholesale Sales Line", max_length=100)


class PhoneConfigResponse(BaseModel):
    """Response model for the organization's active phone configuration."""
    id: str
    organization_id: str
    phone_number: str
    provider: str = "VOBIZ"
    is_active: bool
    display_label: Optional[str] = None
    webhook_url: str
    websocket_url: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TestConnectionResponse(BaseModel):
    """Response model for Vobiz Voice API connectivity and credential verification."""
    status: str
    is_connected: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    provider: str = "VOBIZ"
    auth_id_configured: bool


class CallEventResponse(BaseModel):
    """Audit log entry for a specific state change or packet milestone within a call."""
    id: str
    call_id: str
    vobiz_call_id: str
    event_type: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    event_timestamp: str
    safe_metadata: Dict[str, Any] = Field(default_factory=dict)


class CallResponse(BaseModel):
    """Summary record of a telephony call session."""
    id: str
    organization_id: str
    vobiz_call_id: str
    from_number: str
    to_number: str
    normalized_from_number: str
    normalized_to_number: str
    retailer_id: Optional[str] = None
    retailer_name: Optional[str] = None
    retailer_store_name: Optional[str] = None
    caller_classification: str
    call_status: str
    stream_status: str
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration_seconds: int = 0
    events_count: int = 0
    created_at: Optional[str] = None


class CallListResponse(BaseModel):
    """Paginated list response for organization call records."""
    items: List[CallResponse]
    total: int
    page: int
    limit: int
    pages: int


class CallDetailResponse(CallResponse):
    """Full detail view of a call including all chronological event logs."""
    events: List[CallEventResponse] = Field(default_factory=list)


class SimulateInboundCallRequest(BaseModel):
    """Payload to simulate an inbound call webhook for testing and manual validation."""
    from_number: str = Field(..., description="Caller's mobile phone number")
    to_number: Optional[str] = Field(default=None, description="Distributor's assigned number. If omitted, uses active phone config.")
    call_uuid: Optional[str] = Field(default=None, description="Optional custom CallUUID")
    duration_seconds: Optional[int] = Field(default=0, ge=0)

