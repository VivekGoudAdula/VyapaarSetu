"""
Vyapaar सेतु — Vobiz Telephony Webhooks & WebSocket Audio Streaming Router.
Direct integration point for Vobiz Voice API inbound call answering, lifecycle status updates,
and bidirectional WebSocket media streaming.
"""

import json
import logging
from typing import Dict, Any, Optional
from urllib.parse import parse_qs

from fastapi import APIRouter, Request, Response, WebSocket, WebSocketDisconnect, HTTPException, status, Depends
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import settings
from app.db.mongodb import get_database, mongo_manager
from app.integrations.vobiz.webhooks import verify_vobiz_signature
from app.integrations.vobiz.audio import AudioFrameDecoder
from app.services.call_service import CallService

logger = logging.getLogger("vyapaar_setu.webhooks.vobiz")

router = APIRouter(prefix="/webhooks/vobiz", tags=["Vobiz Telephony Webhooks"])


async def parse_webhook_request(request: Request) -> Dict[str, Any]:
    """
    Safely parses both application/json and application/x-www-form-urlencoded
    payloads sent by Vobiz Voice API webhooks.
    """
    body_bytes = await request.body()
    content_type = request.headers.get("content-type", "").lower()

    if "application/json" in content_type:
        try:
            return json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            return {}
    else:
        # Default or form-urlencoded
        try:
            decoded = body_bytes.decode("utf-8")
            parsed = parse_qs(decoded)
            # Flatten single values
            return {k: v[0] if len(v) == 1 else v for k, v in parsed.items()}
        except Exception:
            return {}


def check_webhook_signature(request: Request, body_bytes: bytes) -> None:
    """Verifies Vobiz webhook cryptographic signature if secret is configured."""
    if not settings.VOBIZ_WEBHOOK_SECRET:
        return

    sig_header = (
        request.headers.get("X-Webhook-Signature")
        or request.headers.get("X-Vobiz-Signature")
        or request.headers.get("x-webhook-signature")
    )

    if not verify_vobiz_signature(body_bytes, sig_header, settings.VOBIZ_WEBHOOK_SECRET):
        logger.warning("Rejected Vobiz webhook: Invalid or missing HMAC-SHA256 signature.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vobiz webhook signature."
        )


@router.post(
    "/inbound-call",
    summary="Vobiz Inbound Call Answer Webhook",
    response_class=Response,
)
async def inbound_call_webhook(
    request: Request,
    db: AsyncDatabase = Depends(get_database),
):
    """
    Vobiz Voice API triggers this webhook when a customer or retailer dials
    the distributor's assigned business phone number.
    
    1. Validates Vobiz signature (if configured).
    2. Resolves destination phone number ('To') to the correct distributor organization.
    3. Resolves caller number ('From') to existing Kirana store in Retailer Directory.
    4. Generates and returns VobizXML with <Stream> instruction for bidirectional audio.
    """
    body_bytes = await request.body()
    check_webhook_signature(request, body_bytes)

    payload = await parse_webhook_request(request)
    logger.info(f"Incoming Vobiz call webhook: To={payload.get('To')}, From={payload.get('From')}, UUID={payload.get('CallUUID')}")

    service = CallService(db)
    vobiz_xml, call_doc = await service.handle_inbound_call(payload)

    return Response(
        content=vobiz_xml,
        media_type="application/xml",
        headers={"Content-Type": "application/xml; charset=utf-8"},
    )


@router.post(
    "/call-status",
    summary="Vobiz Call Status Lifecycle Webhook",
)
async def call_status_webhook(
    request: Request,
    db: AsyncDatabase = Depends(get_database),
):
    """
    Vobiz Voice API sends lifecycle updates (completed, busy, no-answer, failed)
    to this webhook when a call concludes or transitions.
    """
    body_bytes = await request.body()
    check_webhook_signature(request, body_bytes)

    payload = await parse_webhook_request(request)
    logger.info(f"Vobiz call status callback: UUID={payload.get('CallUUID')}, Status={payload.get('CallStatus')}")

    service = CallService(db)
    updated_call = await service.handle_call_status_update(payload)

    return {
        "status": "success",
        "vobiz_call_id": payload.get("CallUUID"),
        "call_status": updated_call.get("call_status") if updated_call else "PROCESSED",
    }


@router.websocket("/media-stream")
async def vobiz_media_stream_websocket(websocket: WebSocket):
    """
    Bidirectional WebSocket audio streaming endpoint for Vobiz Voice API.
    Receives raw 16kHz Linear PCM audio frames and tracks call streaming state.
    
    In Phase 4:
    - Verifies handshake and parses 'start', 'media', and 'stop' frames.
    - Decodes incoming base64 PCM frames and measures byte volume and duration.
    - Updates call streaming status and records audit events.
    - Speech-to-Text and LLM reasoning are deferred to Phase 5 and Phase 6.
    """
    await websocket.accept()
    logger.info("Vobiz WebSocket media streaming connection accepted.")

    # Obtain database handle for websocket lifecycle
    db = mongo_manager.db
    if db is None:
        logger.error("Database connection unavailable for media stream.")
        await websocket.close(code=1011)
        return

    service = CallService(db)
    decoder: Optional[AudioFrameDecoder] = None
    stream_id: Optional[str] = None
    call_uuid: Optional[str] = None

    try:
        while True:
            raw_text = await websocket.receive_text()
            if not raw_text:
                continue

            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                continue

            event_type = data.get("event", "").lower()

            if event_type == "start":
                stream_id = data.get("streamId") or data.get("stream_id") or ""
                call_uuid = data.get("callUuid") or data.get("call_uuid") or ""
                media_format = data.get("mediaFormat", {})

                decoder = AudioFrameDecoder(stream_id=stream_id, call_uuid=call_uuid)
                logger.info(f"Vobiz stream started: StreamID={stream_id}, CallUUID={call_uuid}, Format={media_format}")

                await service.handle_stream_start(
                    stream_id=stream_id,
                    vobiz_call_id=call_uuid,
                    media_format=media_format
                )

            elif event_type == "media":
                if decoder:
                    packet = decoder.decode_media_message(data)
                    # Audio frames are received and tracked.
                    # Speech-to-Text (Gnani Prisma) pipeline attaches here in Phase 5.

            elif event_type == "stop":
                logger.info(f"Vobiz stream stop event received for stream {stream_id}")
                if decoder and stream_id:
                    stats = {
                        "stream_id": stream_id,
                        "packet_count": decoder.packet_count,
                        "total_pcm_bytes": decoder.total_pcm_bytes,
                        "duration_seconds": decoder.total_duration_seconds,
                    }
                    await service.handle_stream_stop(
                        stream_id=stream_id,
                        vobiz_call_id=call_uuid,
                        telemetry_stats=stats
                    )
                break

    except WebSocketDisconnect:
        logger.info(f"Vobiz WebSocket disconnected: StreamID={stream_id}, CallUUID={call_uuid}")
        if decoder and stream_id:
            stats = {
                "stream_id": stream_id,
                "packet_count": decoder.packet_count,
                "total_pcm_bytes": decoder.total_pcm_bytes,
                "duration_seconds": decoder.total_duration_seconds,
                "disconnect_reason": "WebSocketDisconnect",
            }
            await service.handle_stream_stop(
                stream_id=stream_id,
                vobiz_call_id=call_uuid,
                telemetry_stats=stats
            )
    except Exception as e:
        logger.error(f"Error in Vobiz WebSocket media stream: {e}", exc_info=True)
        if decoder and stream_id:
            stats = {"stream_id": stream_id, "error": str(e)}
            await service.handle_stream_stop(
                stream_id=stream_id,
                vobiz_call_id=call_uuid,
                telemetry_stats=stats
            )
