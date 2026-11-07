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
    """
    Verifies Vobiz Voice API webhook cryptographic signature.
    Supports official V3/V2 canonical URL+nonce HMAC-SHA256 and custom webhook signatures.
    Fails closed (HTTP 401) if verification fails when signing key is configured.
    """
    key = (settings.VOBIZ_AUTH_TOKEN or settings.VOBIZ_WEBHOOK_SECRET or "").strip()
    # In development, if neither auth_token nor webhook_secret is set, bypass check
    if not key:
        return

    # Extract target URL without query parameters
    target_url = str(request.url).split("?")[0]
    headers_dict = dict(request.headers)

    is_valid = verify_vobiz_signature(
        target_url=target_url,
        headers=headers_dict,
        auth_token=settings.VOBIZ_AUTH_TOKEN,
        payload_bytes=body_bytes,
        secret=settings.VOBIZ_WEBHOOK_SECRET,
    )

    if not is_valid:
        logger.warning(f"Rejected unauthenticated Vobiz webhook from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Vobiz webhook cryptographic signature."
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
    Receives raw Linear PCM (8kHz/16kHz) or μ-law audio frames and tracks call streaming state.
    
    In Phase 4.1:
    - Parses official nested 'start' frames {"event": "start", "start": {"streamId": ..., "callId": ..., "mediaFormat": ...}}
    - Validates required streamId and callId to prevent unlinked sessions.
    - Decodes incoming Base64 frames adhering to the negotiated mediaFormat (L16 or μ-law).
    - Respects WebSocket close/disconnect as the definitive stream termination signal.
    - Acknowledges 'playedStream' and 'clearedAudio' control events cleanly.
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
    stream_finalized: bool = False

    async def finalize_stream(reason: str = "normal"):
        nonlocal stream_finalized
        if stream_finalized:
            return
        stream_finalized = True
        if decoder and stream_id:
            stats = {
                "stream_id": stream_id,
                "packet_count": decoder.packet_count,
                "total_bytes": decoder.total_raw_bytes,
                "duration_seconds": decoder.total_duration_seconds,
                "encoding": decoder.inbound_encoding,
                "sample_rate": decoder.inbound_sample_rate,
                "termination_reason": reason,
            }
            try:
                await service.handle_stream_stop(
                    stream_id=stream_id,
                    vobiz_call_id=call_uuid,
                    telemetry_stats=stats
                )
            except Exception as e:
                logger.error(f"Error finalizing stream {stream_id}: {e}")

    try:
        while True:
            raw_text = await websocket.receive_text()
            if not raw_text:
                continue

            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                logger.warning("Received invalid non-JSON text frame on Vobiz media stream.")
                continue

            event_type = data.get("event", "").lower()

            if event_type == "start":
                # Support official documented nested start object with root fallback
                start_block = data.get("start") if isinstance(data.get("start"), dict) else {}
                
                stream_id = (
                    start_block.get("streamId")
                    or start_block.get("stream_id")
                    or data.get("streamId")
                    or data.get("stream_id")
                    or ""
                ).strip()

                call_uuid = (
                    start_block.get("callId")
                    or start_block.get("call_id")
                    or start_block.get("callUuid")
                    or start_block.get("call_uuid")
                    or data.get("callId")
                    or data.get("callUuid")
                    or data.get("call_uuid")
                    or ""
                ).strip()

                media_format = start_block.get("mediaFormat") or data.get("mediaFormat") or {}

                # Strict identifier validation: never bind an unlinked stream
                if not stream_id or not call_uuid:
                    logger.warning(
                        f"Rejected Vobiz stream start frame: Missing streamId or callId (data={data})"
                    )
                    continue

                decoder = AudioFrameDecoder(
                    stream_id=stream_id,
                    call_uuid=call_uuid,
                    media_format=media_format
                )
                logger.info(
                    f"Vobiz stream initialized: StreamID={stream_id}, CallUUID={call_uuid}, "
                    f"Encoding={decoder.inbound_encoding}, Rate={decoder.inbound_sample_rate}Hz"
                )

                await service.handle_stream_start(
                    stream_id=stream_id,
                    vobiz_call_id=call_uuid,
                    media_format=media_format
                )

            elif event_type == "media":
                if decoder:
                    packet = decoder.decode_media_message(data)
                    # Decoded packet is tracked; STT (Gnani Prisma) pipeline attaches in Phase 5.

            elif event_type in ("playedstream", "played_stream"):
                # Acknowledgment from Vobiz for queued playback completion (Phase 5 preparation)
                checkpoint_name = data.get("name") or data.get("checkpoint")
                logger.debug(f"Vobiz playedStream acknowledged for stream {stream_id}, checkpoint={checkpoint_name}")

            elif event_type in ("clearedaudio", "cleared_audio"):
                # Acknowledgment from Vobiz that playback buffer was cleared on barge-in
                logger.debug(f"Vobiz clearedAudio acknowledged for stream {stream_id}")

            elif event_type == "stop":
                logger.info(f"Vobiz stream stop event frame received for stream {stream_id}")
                await finalize_stream(reason="vobiz_stop_event")
                break

    except WebSocketDisconnect:
        logger.info(f"Vobiz WebSocket closed by peer: StreamID={stream_id}, CallUUID={call_uuid}")
        await finalize_stream(reason="websocket_disconnect")
    except Exception as e:
        logger.error(f"Error in Vobiz WebSocket media stream: {e}", exc_info=True)
        await finalize_stream(reason=f"exception_{type(e).__name__}")
    finally:
        # Guarantee definitive stream termination cleanup upon socket exit
        await finalize_stream(reason="socket_exit")

