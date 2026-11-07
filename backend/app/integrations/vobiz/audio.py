"""
Vyapaar सेतु — Vobiz Bidirectional Audio Streaming Codec & Transport.
Handles binary PCM 16kHz audio frame decoding, base64 transcoding,
packet telemetry, and outbound audio response construction for Vobiz Stream.
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
    raw_pcm_bytes: bytes
    byte_length: int
    duration_ms: float


class AudioFrameDecoder:
    """
    Decodes and tracks inbound audio frames over the Vobiz WebSocket stream.
    Default audio format: audio/x-l16;rate=16000 (16-bit Linear PCM, 16kHz, mono).
    1 second of audio = 16,000 samples * 2 bytes = 32,000 bytes.
    """

    BYTES_PER_SECOND_16K_MONO = 32000  # 16000 samples/sec * 2 bytes/sample (16-bit)

    def __init__(self, stream_id: str, call_uuid: Optional[str] = None):
        self.stream_id = stream_id
        self.call_uuid = call_uuid
        self.packet_count: int = 0
        self.total_pcm_bytes: int = 0

    @property
    def total_duration_seconds(self) -> float:
        """Calculates total stream duration received based on raw PCM byte volume."""
        return round(self.total_pcm_bytes / self.BYTES_PER_SECOND_16K_MONO, 3)

    def decode_media_message(self, message: Dict[str, Any]) -> Optional[AudioPacket]:
        """
        Decodes an incoming 'media' event from Vobiz WebSocket.
        Vobiz sends audio payload either in message['media']['payload'] or message['payload'].
        """
        try:
            media_info = message.get("media", {})
            if isinstance(media_info, dict):
                b64_payload = media_info.get("payload") or message.get("payload")
            else:
                b64_payload = message.get("payload")

            if not b64_payload:
                return None

            pcm_bytes = base64.b64decode(b64_payload)
            byte_len = len(pcm_bytes)
            self.packet_count += 1
            self.total_pcm_bytes += byte_len

            duration_ms = (byte_len / self.BYTES_PER_SECOND_16K_MONO) * 1000.0

            seq = message.get("sequenceNumber") or self.packet_count

            return AudioPacket(
                stream_id=self.stream_id,
                call_uuid=self.call_uuid,
                sequence_number=int(seq),
                raw_pcm_bytes=pcm_bytes,
                byte_length=byte_len,
                duration_ms=round(duration_ms, 2)
            )
        except Exception as e:
            logger.error(f"Error decoding Vobiz audio media frame: {e}")
            return None

    @staticmethod
    def build_outbound_play_audio(
        stream_id: str,
        pcm_bytes: bytes,
        sample_rate: int = 16000,
        content_type: str = "audio/x-l16;rate=16000"
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
                "payload": b64_audio
            }
        }

    @staticmethod
    def build_clear_audio(stream_id: str) -> Dict[str, Any]:
        """
        Constructs the 'clearAudio' event JSON sent to Vobiz
        to immediately interrupt outbound playback when the caller speaks.
        """
        return {
            "event": "clearAudio",
            "streamId": stream_id
        }
