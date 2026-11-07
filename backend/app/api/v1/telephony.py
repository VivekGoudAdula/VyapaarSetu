import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.integrations.twilio.client import twilio_service
from app.schemas.telephony import (
    PhoneConfigResponse,
    PhoneConfigUpdate,
    CallResponse,
    CallDetailResponse,
    CallListResponse,
    TwilioConnectionTestResponse,
)
from app.services.telephony_service import TelephonyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telephony", tags=["Telephony & Voice Channels"])


@router.get(
    "/config",
    response_model=PhoneConfigResponse,
    summary="Get organization telephony configuration"
)
async def get_phone_config(
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Fetch the distributor's Twilio phone configuration, webhook endpoints,
    voice persona defaults, and India number eligibility notices.
    """
    service = TelephonyService(db)
    return await service.get_or_create_config(org_id=tenant.organization_id)


@router.put(
    "/config",
    response_model=PhoneConfigResponse,
    summary="Update organization telephony configuration"
)
async def update_phone_config(
    payload: PhoneConfigUpdate,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Assign or update the distributor's Twilio phone number and voice persona settings.
    Requires Staff or Owner privileges.
    """
    service = TelephonyService(db)
    return await service.update_config(org_id=tenant.organization_id, payload=payload)


@router.post(
    "/test-connection",
    response_model=TwilioConnectionTestResponse,
    summary="Validate Twilio credentials"
)
async def test_twilio_connection(
    tenant: TenantContext = Depends(get_tenant_context)
):
    """
    Validate Twilio Account SID and Auth Token against Twilio REST API.
    Returns status CONNECTED or DISCONNECTED with friendly diagnostic notice.
    """
    result = await twilio_service.test_connection()
    return TwilioConnectionTestResponse(**result)


@router.get(
    "/calls",
    response_model=CallListResponse,
    summary="List inbound calls"
)
async def list_calls(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(15, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (RINGING, IN_PROGRESS, COMPLETED, BUSY, FAILED)"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Retrieve paginated history of incoming voice calls strictly isolated to the authenticated organization.
    Includes caller ID resolution to registered Kirana stores.
    """
    service = TelephonyService(db)
    return await service.list_calls(
        org_id=tenant.organization_id,
        page=page,
        limit=limit,
        status_filter=status
    )


@router.get(
    "/calls/{call_id}",
    response_model=CallDetailResponse,
    summary="Get call details with audit events"
)
async def get_call_detail(
    call_id: str = Path(..., description="Unique call record ID"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Retrieve complete call metadata and chronological audit events (handshake, media stream start/stop, status transitions).
    """
    service = TelephonyService(db)
    return await service.get_call_detail(org_id=tenant.organization_id, call_id=call_id)
