import logging
from typing import Optional
from fastapi import APIRouter, Request, Response, WebSocket, Depends, status
from pymongo.asynchronous.database import AsyncDatabase

from app.db.mongodb import get_database
from app.integrations.twilio.security import verify_twilio_signature
from app.integrations.twilio.twiml_builder import (
    build_media_stream_twiml,
    build_rejection_twiml,
    get_default_media_stream_url
)
from app.integrations.twilio.media_stream import TwilioMediaStreamHandler
from app.services.telephony_service import TelephonyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/twilio", tags=["Twilio Webhooks"])


@router.post("/inbound-call")
async def handle_inbound_call(
    request: Request,
    db: AsyncDatabase = Depends(get_database)
) -> Response:
    """
    Twilio Inbound Voice Webhook.
    Triggered when a retailer or customer dials the distributor's Twilio phone number.
    Validates Twilio signature, resolves tenant organization and caller ID,
    and returns TwiML instructing Twilio to connect to the Media Stream WebSocket.
    """
    form_data = await request.form()
    form_dict = dict(form_data)

    # Validate Twilio signature
    if not verify_twilio_signature(request, form_dict):
        logger.warning("Rejected inbound Twilio voice call: Invalid signature.")
        return Response(content="Forbidden: Invalid Twilio Signature", status_code=status.HTTP_403_FORBIDDEN)

    call_sid = str(form_dict.get("CallSid", ""))
    from_phone = str(form_dict.get("From", ""))
    to_phone = str(form_dict.get("To", ""))
    account_sid = str(form_dict.get("AccountSid", ""))

    logger.info(f"Incoming Twilio voice call: From={from_phone}, To={to_phone}, CallSid={call_sid}")

    service = TelephonyService(db)
    resolution = await service.resolve_inbound_call(
        from_phone=from_phone,
        to_phone=to_phone,
        call_sid=call_sid,
        account_sid=account_sid
    )

    if not resolution.get("allowed"):
        logger.warning(f"Rejecting call {call_sid}: {resolution.get('reason')}")
        twiml = build_rejection_twiml(
            message="Namaste. This Vyapaar सेतु business number is not currently active.",
            language="hi-IN"
        )
        return Response(content=twiml, media_type="application/xml")

    # Connect to Media Stream WebSocket
    call_id = resolution["call_id"]
    org_id = resolution["organization_id"]
    websocket_url = get_default_media_stream_url()

    twiml = build_media_stream_twiml(
        websocket_url=websocket_url,
        call_id=call_id,
        organization_id=org_id,
        custom_parameters={
            "retailer_name": resolution.get("retailer_name", "Unknown Retailer"),
            "from_phone": from_phone,
            "to_phone": to_phone
        }
    )

    return Response(content=twiml, media_type="application/xml")


@router.post("/call-status")
async def handle_call_status(
    request: Request,
    db: AsyncDatabase = Depends(get_database)
) -> Response:
    """
    Twilio Call Status Callback Webhook.
    Triggered by Twilio when call transitions between ringing, in-progress, completed, busy, failed.
    Updates call document and appends to call audit event trail.
    """
    form_data = await request.form()
    form_dict = dict(form_data)

    if not verify_twilio_signature(request, form_dict):
        logger.warning("Rejected Twilio status callback: Invalid signature.")
        return Response(content="Forbidden: Invalid Twilio Signature", status_code=status.HTTP_403_FORBIDDEN)

    call_sid = str(form_dict.get("CallSid", ""))
    call_status = str(form_dict.get("CallStatus", "in-progress"))
    duration = form_dict.get("CallDuration")
    recording_url = form_dict.get("RecordingUrl")
    error_code = form_dict.get("ErrorCode")

    duration_int: Optional[int] = int(duration) if duration and str(duration).isdigit() else None

    service = TelephonyService(db)
    await service.handle_call_status_update(
        call_sid=call_sid,
        twilio_status=call_status,
        duration=duration_int,
        recording_url=str(recording_url) if recording_url else None,
        error_code=str(error_code) if error_code else None
    )

    return Response(content="<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response/>", media_type="application/xml")


@router.websocket("/media-stream")
async def handle_media_stream(
    websocket: WebSocket,
    db: AsyncDatabase = Depends(get_database)
):
    """
    Twilio Media Stream WebSocket endpoint.
    Accepts bidirectional raw audio stream (μ-law 8000Hz mono) from Twilio.
    Dispatches audio chunks and handles marks / clear commands.
    """
    handler = TwilioMediaStreamHandler(db)
    await handler.handle_connection(websocket)
