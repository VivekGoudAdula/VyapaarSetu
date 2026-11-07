"""
Vyapaar सेतु — Vobiz Bidirectional Audio Streaming Codec & Transport.
Handles binary PCM 16kHz/8kHz and μ-law audio frame decoding, base64 transcoding,
negotiated mediaFormat handling, packet telemetry, and outbound audio/control message construction.
"""

import base64
import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any

logger = logging.getLogger("vyapaar_setu.telephony.audio")


@dataclass
class AudioPacket:
    """Represents a decoded inbound audio packet from Vobiz Stream."""
    stream_id: str
    call_uuid: Optional[str]
    sequence_number: int
    raw_audio_bytes: bytes
    byte_length: int
    duration_ms: float
    encoding: str
    sample_rate: int


class AudioFrameDecoder:
    """
    Decodes and tracks inbound audio frames over the Vobiz WebSocket stream.
    Supports documented Vobiz inbound formats:
    - audio/x-l16 (Linear PCM 16-bit, 8000 Hz, 16000 Hz, or 24000 Hz)
    - audio/x-mulaw (G.711 μ-law 8-bit, 8000 Hz)
    """

    def __init__(
        self,
        stream_id: str,
        call_uuid: Optional[str] = None,
        media_format: Optional[Dict[str, Any]] = None,
    ):
        self.stream_id = stream_id
        self.call_uuid = call_uuid
        self.packet_count: int = 0
        self.total_raw_bytes: int = 0

        # Parse negotiated inbound media format
        format_dict = media_format or {}
        raw_encoding = str(format_dict.get("encoding") or format_dict.get("contentType") or "audio/x-l16").lower()
        self.inbound_encoding = "audio/x-mulaw" if "mulaw" in raw_encoding or "ulaw" in raw_encoding else "audio/x-l16"
        
        try:
            self.inbound_sample_rate = int(format_dict.get("sampleRate") or (8000 if self.inbound_encoding == "audio/x-mulaw" else 16000))
        except (ValueError, TypeError):
            self.inbound_sample_rate = 8000 if self.inbound_encoding == "audio/x-mulaw" else 16000

        # Calculate bytes per second based on bit depth:
        # L16 is 16-bit (2 bytes per sample) mono
        # mulaw is 8-bit (1 byte per sample) mono
        if self.inbound_encoding == "audio/x-mulaw":
            self.bytes_per_second = self.inbound_sample_rate * 1
        else:
            self.bytes_per_second = self.inbound_sample_rate * 2

    @property
    def total_duration_seconds(self) -> float:
        """Calculates total stream duration received based on raw byte volume and negotiated rate."""
        if self.bytes_per_second <= 0:
            return 0.0
        return round(self.total_raw_bytes / self.bytes_per_second, 3)

    def decode_media_message(self, message: Dict[str, Any]) -> Optional[AudioPacket]:
        """
        Decodes an incoming 'media' event from Vobiz WebSocket.
        Vobiz sends audio payload in message['media']['payload'] or message['payload'].
        """
        try:
            media_info = message.get("media", {})
            if isinstance(media_info, dict):
                b64_payload = media_info.get("payload") or message.get("payload")
            else:
                b64_payload = message.get("payload")

            if not b64_payload or not isinstance(b64_payload, str):
                return None

            raw_bytes = base64.b64decode(b64_payload.strip())
            byte_len = len(raw_bytes)
            if byte_len == 0:
                return None

            self.packet_count += 1
            self.total_raw_bytes += byte_len

            duration_ms = (byte_len / self.bytes_per_second) * 1000.0 if self.bytes_per_second > 0 else 0.0

            seq = message.get("sequenceNumber") or self.packet_count

            return AudioPacket(
                stream_id=self.stream_id,
                call_uuid=self.call_uuid,
                sequence_number=int(seq),
                raw_audio_bytes=raw_bytes,
                byte_length=byte_len,
                duration_ms=round(duration_ms, 2),
                encoding=self.inbound_encoding,
                sample_rate=self.inbound_sample_rate
            )
        except Exception as e:
            logger.warning(f"Error decoding Vobiz audio media frame: {e}")
            return None

    @staticmethod
    def build_outbound_play_audio(
        stream_id: str,
        pcm_bytes: bytes,
        sample_rate: int = 16000,
        content_type: str = "audio/x-l16",
    ) -> Dict[str, Any]:
        """
        Constructs the outbound 'playAudio' event JSON sent to Vobiz
        to play synthesized speech or chime back to the caller.
        """
        b64_audio = base64.b64encode(pcm_bytes).decode("ascii")
        return {
            "event": "playAudio",
            "streamId": stream_id,
            "media": {
                "contentType": content_type,
                "sampleRate": sample_rate,
                "payload": b64_audio,
            }
        }

    @staticmethod
    def build_clear_audio(stream_id: str) -> Dict[str, Any]:
        """
        Constructs the 'clearAudio' event JSON sent to Vobiz
        to immediately interrupt outbound playback when the caller speaks (barge-in).
        """
        return {
            "event": "clearAudio",
            "streamId": stream_id,
        }

    @staticmethod
    def build_checkpoint(stream_id: str, checkpoint_name: str) -> Dict[str, Any]:
        """
        Constructs the 'checkpoint' event JSON sent to Vobiz to mark the end
        of an utterance segment for playedStream acknowledgment tracking.
        """
        return {
            "event": "checkpoint",
            "streamId": stream_id,
            "name": checkpoint_name,
        }
