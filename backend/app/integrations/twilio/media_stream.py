import json
import logging
from typing import Optional, Dict, Any, Callable, Awaitable
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
from app.integrations.twilio.audio import decode_mulaw_payload, encode_mulaw_payload, calculate_mulaw_duration_ms

logger = logging.getLogger(__name__)


class MediaStreamSession:
    """
    Manages an active Twilio Media Stream WebSocket session.
    Tracks stream lifecycle, inbound audio bytes, DTMF digits, and handles
    bidirectional messaging (outbound audio, marks, and clear/barge-in commands).
    """

    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.stream_sid: Optional[str] = None
        self.call_sid: Optional[str] = None
        self.call_id: Optional[str] = None
        self.organization_id: Optional[str] = None
        self.account_sid: Optional[str] = None

        self.is_active: bool = False
        self.inbound_chunks_count: int = 0
        self.total_audio_bytes: int = 0
        self.started_at: Optional[datetime] = None
        self.stopped_at: Optional[datetime] = None

        # Callbacks for downstream listeners (e.g. STT engine in Phase 5)
        self.on_audio_chunk: Optional[Callable[[bytes], Awaitable[None]]] = None
        self.on_dtmf: Optional[Callable[[str], Awaitable[None]]] = None

    async def send_audio_chunk(self, mulaw_bytes: bytes) -> None:
        """Send an outbound μ-law audio chunk to Twilio for speaker playback."""
        if not self.is_active or not self.stream_sid:
            logger.warning("Attempted to send audio to inactive or uninitialized MediaStreamSession.")
            return

        payload_b64 = encode_mulaw_payload(mulaw_bytes)
        message = {
            "event": "media",
            "streamSid": self.stream_sid,
            "media": {
                "payload": payload_b64
            }
        }
        await self.websocket.send_text(json.dumps(message))

    async def send_mark(self, mark_name: str) -> None:
        """
        Send a mark event to Twilio. When Twilio completes playback up to this mark,
        it will send back a corresponding mark event.
        """
        if not self.is_active or not self.stream_sid:
            return

        message = {
            "event": "mark",
            "streamSid": self.stream_sid,
            "mark": {
                "name": mark_name
            }
        }
        await self.websocket.send_text(json.dumps(message))

    async def clear_buffer(self) -> None:
        """
        Send a clear message to immediately stop Twilio playback (barge-in interruption).
        """
        if not self.is_active or not self.stream_sid:
            return

        message = {
            "event": "clear",
            "streamSid": self.stream_sid
        }
        await self.websocket.send_text(json.dumps(message))
        logger.info(f"Sent clear/barge-in command for stream {self.stream_sid}")

    @property
    def estimated_duration_ms(self) -> int:
        """Estimate total audio duration in milliseconds based on received bytes."""
        return calculate_mulaw_duration_ms(self.total_audio_bytes)


class TwilioMediaStreamHandler:
    """
    Dispatcher and lifecycle manager for incoming Twilio Media Stream WebSocket connections.
    """

    def __init__(self, db):
        self.db = db

    async def handle_connection(self, websocket: WebSocket) -> None:
        """
        Main WebSocket loop for Twilio Media Streams.
        Handles connection handshake, parsing events, audio dispatch, and teardown.
        """
        await websocket.accept()
        session = MediaStreamSession(websocket)
        logger.info("Accepted new Twilio Media Stream WebSocket connection.")

        try:
            while True:
                message_text = await websocket.receive_text()
                if not message_text:
                    continue

                try:
                    data = json.loads(message_text)
                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON on Twilio Media Stream.")
                    continue

                event_type = data.get("event")

                if event_type == "connected":
                    logger.info("Twilio Media Stream handshake confirmed ('connected' event).")

                elif event_type == "start":
                    await self._handle_start_event(session, data)

                elif event_type == "media":
                    await self._handle_media_event(session, data)

                elif event_type == "dtmf":
                    await self._handle_dtmf_event(session, data)

                elif event_type == "mark":
                    mark_name = data.get("mark", {}).get("name", "")
                    logger.debug(f"Twilio playback reached mark '{mark_name}' on stream {session.stream_sid}")

                elif event_type == "stop":
                    await self._handle_stop_event(session, data)
                    break

        except WebSocketDisconnect:
            logger.info(f"Twilio Media Stream disconnected for streamSid {session.stream_sid or 'UNKNOWN'}")
        except Exception as exc:
            logger.error(f"Error handling Twilio Media Stream: {exc}", exc_info=True)
        finally:
            session.is_active = False
            session.stopped_at = datetime.now(timezone.utc)
            if session.call_id and session.organization_id:
                await self._persist_event(
                    call_id=session.call_id,
                    org_id=session.organization_id,
                    event_type="STREAM_CLOSED",
                    payload={
                        "total_chunks": session.inbound_chunks_count,
                        "total_bytes": session.total_audio_bytes,
                        "duration_ms": session.estimated_duration_ms
                    }
                )

    async def _handle_start_event(self, session: MediaStreamSession, data: Dict[str, Any]) -> None:
        """Process 'start' event containing stream metadata and custom parameters."""
        session.is_active = True
        session.started_at = datetime.now(timezone.utc)
        session.stream_sid = data.get("streamSid")

        start_data = data.get("start", {})
        session.call_sid = start_data.get("callSid")
        session.account_sid = start_data.get("accountSid")

        custom_params = start_data.get("customParameters", {})
        session.call_id = custom_params.get("call_id")
        session.organization_id = custom_params.get("organization_id")

        logger.info(
            f"Twilio Media Stream started: streamSid={session.stream_sid}, "
            f"callSid={session.call_sid}, call_id={session.call_id}, "
            f"org_id={session.organization_id}"
        )

        if session.call_id and session.organization_id:
            await self._persist_event(
                call_id=session.call_id,
                org_id=session.organization_id,
                event_type="STREAM_STARTED",
                payload={
                    "stream_sid": session.stream_sid,
                    "call_sid": session.call_sid,
                    "media_format": start_data.get("mediaFormat", {})
                }
            )

    async def _handle_media_event(self, session: MediaStreamSession, data: Dict[str, Any]) -> None:
        """Process incoming 'media' audio packet."""
        media_data = data.get("media", {})
        payload_b64 = media_data.get("payload", "")

        raw_bytes = decode_mulaw_payload(payload_b64)
        if raw_bytes:
            session.inbound_chunks_count += 1
            session.total_audio_bytes += len(raw_bytes)

            # In Phase 5: send raw_bytes to ASR / Gnani Prisma callback
            if session.on_audio_chunk:
                try:
                    await session.on_audio_chunk(raw_bytes)
                except Exception as err:
                    logger.error(f"Error in on_audio_chunk callback: {err}")

    async def _handle_dtmf_event(self, session: MediaStreamSession, data: Dict[str, Any]) -> None:
        """Process incoming DTMF touch-tone digit."""
        dtmf_digit = data.get("dtmf", {}).get("digit", "")
        logger.info(f"Received DTMF digit '{dtmf_digit}' for call {session.call_sid}")

        if session.call_id and session.organization_id:
            await self._persist_event(
                call_id=session.call_id,
                org_id=session.organization_id,
                event_type="DTMF_DIGIT_RECEIVED",
                payload={"digit": dtmf_digit}
            )

        if session.on_dtmf:
            try:
                await session.on_dtmf(dtmf_digit)
            except Exception as err:
                logger.error(f"Error in on_dtmf callback: {err}")

    async def _handle_stop_event(self, session: MediaStreamSession, data: Dict[str, Any]) -> None:
        """Process 'stop' event indicating stream teardown by Twilio."""
        session.is_active = False
        session.stopped_at = datetime.now(timezone.utc)
        logger.info(f"Twilio Media Stream stopped for callSid {session.call_sid}")

        if session.call_id and session.organization_id:
            await self._persist_event(
                call_id=session.call_id,
                org_id=session.organization_id,
                event_type="STREAM_STOPPED",
                payload={
                    "stream_sid": session.stream_sid,
                    "total_chunks": session.inbound_chunks_count,
                    "total_bytes": session.total_audio_bytes,
                    "duration_ms": session.estimated_duration_ms
                }
            )

    async def _persist_event(
        self,
        call_id: str,
        org_id: str,
        event_type: str,
        payload: Dict[str, Any]
    ) -> None:
        """Safely write call event record to MongoDB Atlas."""
        try:
            event_doc = {
                "call_id": call_id,
                "organization_id": org_id,
                "event_type": event_type,
                "payload": payload,
                "created_at": datetime.now(timezone.utc)
            }
            await self.db.call_events.insert_one(event_doc)
        except Exception as exc:
            logger.error(f"Failed to persist call event {event_type}: {exc}")
