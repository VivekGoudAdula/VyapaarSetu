import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Check if native audioop is available
try:
    import audioop
    HAS_AUDIOOP = True
except ImportError:
    HAS_AUDIOOP = False
    logger.info("audioop module not available, using pure-Python audio conversion fallbacks.")


# Precomputed lookup tables for pure-Python fallback if audioop is missing
_BIAS = 0x84
_CLIP = 32635

_EXP_LUT = [
    0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
]


def _ulaw_byte_to_lin16(u_byte: int) -> int:
    """Convert single μ-law byte to 16-bit linear PCM sample."""
    u_byte = ~u_byte & 0xFF
    sign = (u_byte & 0x80)
    exponent = (u_byte >> 4) & 0x07
    mantissa = u_byte & 0x0F
    sample = ((mantissa << 3) + _BIAS) << exponent
    sample -= _BIAS
    return -sample if sign else sample


def _lin16_to_ulaw_byte(sample: int) -> int:
    """Convert single 16-bit linear PCM sample to μ-law byte."""
    sign = (sample >> 8) & 0x80
    if sign:
        sample = -sample
    if sample > _CLIP:
        sample = _CLIP
    sample += _BIAS
    exponent = _EXP_LUT[(sample >> 7) & 0xFF]
    mantissa = (sample >> (exponent + 3)) & 0x0F
    return ~(sign | (exponent << 4) | mantissa) & 0xFF


def decode_mulaw_payload(base64_payload: str) -> bytes:
    """
    Decode Base64 audio payload received from Twilio Media Streams.
    Returns raw μ-law bytes (PCMU, 8kHz, 8-bit mono).
    """
    if not base64_payload:
        return b""
    try:
        return base64.b64decode(base64_payload)
    except Exception as e:
        logger.warning(f"Failed to decode Twilio base64 audio payload: {e}")
        return b""


def encode_mulaw_payload(mulaw_bytes: bytes) -> str:
    """
    Encode raw μ-law bytes into Base64 for sending to Twilio Media Streams.
    """
    if not mulaw_bytes:
        return ""
    return base64.b64encode(mulaw_bytes).decode("ascii")


def mulaw_to_linear16(mulaw_bytes: bytes) -> bytes:
    """
    Convert 8kHz 8-bit μ-law audio to 8kHz 16-bit signed Linear PCM (little-endian).
    Required by downstream ASR/STT engines (Gnani Prisma, Whisper, Google STT).
    """
    if not mulaw_bytes:
        return b""

    if HAS_AUDIOOP:
        # width=2 for 16-bit linear output
        return audioop.ulaw2lin(mulaw_bytes, 2)

    # Pure Python fallback
    result = bytearray(len(mulaw_bytes) * 2)
    for i, b in enumerate(mulaw_bytes):
        sample = _ulaw_byte_to_lin16(b)
        result[i * 2] = sample & 0xFF
        result[i * 2 + 1] = (sample >> 8) & 0xFF
    return bytes(result)


def linear16_to_mulaw(pcm_bytes: bytes) -> bytes:
    """
    Convert 8kHz 16-bit signed Linear PCM audio back to 8-bit μ-law for Twilio playback.
    """
    if not pcm_bytes:
        return b""

    if HAS_AUDIOOP:
        return audioop.lin2ulaw(pcm_bytes, 2)

    # Pure Python fallback
    count = len(pcm_bytes) // 2
    result = bytearray(count)
    for i in range(count):
        sample = int.from_bytes(pcm_bytes[i * 2: i * 2 + 2], byteorder="little", signed=True)
        result[i] = _lin16_to_ulaw_byte(sample)
    return bytes(result)


def calculate_mulaw_duration_ms(mulaw_bytes_len: int, sample_rate: int = 8000) -> int:
    """
    Calculate audio duration in milliseconds from μ-law byte length.
    At 8000 Hz mono 8-bit, 1 byte = 1 sample = 0.125 ms.
    """
    if mulaw_bytes_len <= 0 or sample_rate <= 0:
        return 0
    return int((mulaw_bytes_len * 1000) / sample_rate)
