"""
Vyapaar सेतु — Telephony Management & Call History API.
Enables wholesale distributors to manage their dedicated Vobiz business phone number,
test telephony connectivity, inspect call logs, and view chronological call event timelines.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status, HTTPException
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.telephony import (
    PhoneConfigUpdate,
    PhoneConfigResponse,
    TestConnectionResponse,
    CallListResponse,
    CallDetailResponse,
    SimulateInboundCallRequest,
)
from app.services.telephony_service import TelephonyService
from app.services.call_service import CallService

router = APIRouter(prefix="/telephony", tags=["Telephony & Voice Management"])


@router.get(
    "/config",
    response_model=Optional[PhoneConfigResponse],
    summary="Get distributor's active Vobiz phone configuration"
)
async def get_phone_config(
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database),
):
    """Retrieves the assigned Vobiz phone number and webhook endpoints for the organization."""
    service = TelephonyService(db)
    return await service.get_phone_config(tenant.organization_id)


@router.post(
    "/config",
    response_model=PhoneConfigResponse,
    summary="Update or assign dedicated Vobiz phone number"
)
async def update_phone_config(
    payload: PhoneConfigUpdate,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database),
):
    """
    Configures the distributor's dedicated Vobiz business phone number.
    Enforces global phone uniqueness so no two distributors can register the same phone number.
    """
    service = TelephonyService(db)
    try:
        return await service.upsert_phone_config(
            organization_id=tenant.organization_id,
            phone_number=payload.phone_number,
            is_active=payload.is_active,
            display_label=payload.display_label,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/test-connection",
    response_model=TestConnectionResponse,
    summary="Test Vobiz Voice API connectivity and account credentials"
)
async def test_vobiz_connection(
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database),
):
    """Checks credentials with the live Vobiz API and returns connection diagnostic status."""
    service = TelephonyService(db)
    return await service.test_connection()


@router.get(
    "/calls",
    response_model=CallListResponse,
    summary="List call history for the distributor"
)
async def list_calls(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by call status (INITIATED, IN_PROGRESS, COMPLETED, etc.)"),
    caller_classification: Optional[str] = Query(None, description="Filter by classification (REGISTERED_RETAILER, UNKNOWN)"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database),
):
    """Lists inbound call sessions strictly scoped to the authenticated organization."""
    service = CallService(db)
    return await service.list_calls(
        organization_id=tenant.organization_id,
        page=page,
        limit=limit,
        status=status,
        caller_classification=caller_classification,
    )


@router.get(
    "/calls/{call_id}",
    response_model=CallDetailResponse,
    summary="Get full details and event timeline for a call"
)
async def get_call_detail(
    call_id: str = Path(..., description="ID of the call session"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database),
):
    """
    Returns complete call record and chronological state transitions / events.
    Strict tenant isolation: cannot access calls belonging to other organizations.
    """
    service = CallService(db)
    detail = await service.get_call_detail(
        organization_id=tenant.organization_id,
        call_id=call_id
    )
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call record not found."
        )
    return detail


@router.post(
    "/simulate-call",
    response_model=CallDetailResponse,
    summary="Simulate an inbound phone call for testing"
)
async def simulate_inbound_call(
    payload: SimulateInboundCallRequest,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database),
):
    """
    Simulates an incoming Vobiz call from a Kirana retailer mobile number.
    Allows distributors and QA to verify caller resolution and event tracking
    without waiting for external telephony provider webhooks.
    """
    telephony_service = TelephonyService(db)
    call_service = CallService(db)

    # Determine dialed number (use org's configured phone if not supplied)
    to_number = payload.to_number
    if not to_number:
        config = await telephony_service.get_phone_config(tenant.organization_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization does not have a configured phone number. Configure a phone number first."
            )
        to_number = config["phone_number"]

    call_uuid = payload.call_uuid or f"sim_{tenant.organization_id[:6]}_{int(db.client.get_default_database().name.__hash__() % 100000)}_{payload.from_number[-4:]}"

    sim_payload = {
        "CallUUID": call_uuid,
        "From": payload.from_number,
        "To": to_number,
        "CallStatus": "ringing",
        "Direction": "inbound",
    }

    xml, call_doc = await call_service.handle_inbound_call(sim_payload)
    if not call_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to simulate call: Number not mapped to this organization."
        )

    # If simulated duration requested, update status to COMPLETED
    if payload.duration_seconds and payload.duration_seconds > 0:
        await call_service.handle_call_status_update({
            "CallUUID": call_uuid,
            "CallStatus": "completed",
            "Duration": payload.duration_seconds,
            "HangupCause": "normal_clearing",
        })

    call_id = str(call_doc["_id"])
    detail = await call_service.get_call_detail(tenant.organization_id, call_id)
    return detail

