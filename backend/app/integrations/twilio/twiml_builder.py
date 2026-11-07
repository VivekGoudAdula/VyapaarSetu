import logging
from typing import Optional, Dict
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream, Say, Hangup, Dial, Number
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_media_stream_twiml(
    websocket_url: str,
    call_id: str,
    organization_id: str,
    custom_parameters: Optional[Dict[str, str]] = None
) -> str:
    """
    Generate TwiML response connecting an incoming call to a bidirectional WebSocket Media Stream.

    Twilio Media Stream protocol:
    - Audio encoding: audio/x-mulaw (PCMU)
    - Sample rate: 8000 Hz, 8-bit, 1 channel (mono)
    """
    response = VoiceResponse()
    connect = Connect()
    stream = Stream(url=websocket_url)

    # Attach contextual parameters passed to the WebSocket start event
    stream.parameter(name="call_id", value=str(call_id))
    stream.parameter(name="organization_id", value=str(organization_id))

    if custom_parameters:
        for key, val in custom_parameters.items():
            if val is not None:
                stream.parameter(name=str(key), value=str(val))

    connect.append(stream)
    response.append(connect)
    return str(response)


def build_rejection_twiml(message: Optional[str] = None, language: str = "hi-IN") -> str:
    """
    Generate TwiML to politely inform caller and hang up when an organization or number is unassigned/inactive.
    """
    response = VoiceResponse()
    if message:
        response.say(message, language=language)
    else:
        response.say(
            "Namaste. Vyapaar Setu business line is currently unavailable. Please try again later.",
            language="en-IN"
        )
    response.hangup()
    return str(response)


def build_forward_twiml(forward_phone_number: str) -> str:
    """
    Generate TwiML to forward the call to a human staff phone number if voice agent escalates.
    """
    response = VoiceResponse()
    dial = Dial()
    dial.number(forward_phone_number)
    response.append(dial)
    return str(response)


def get_default_media_stream_url() -> str:
    """
    Construct the public WebSocket URL for the Twilio Media Stream.
    Uses PUBLIC_WEBSOCKET_URL or replaces http/https in PUBLIC_BASE_URL with ws/wss.
    """
    if settings.PUBLIC_WEBSOCKET_URL and settings.PUBLIC_WEBSOCKET_URL.startswith("ws"):
        base = settings.PUBLIC_WEBSOCKET_URL.rstrip("/")
    else:
        base = settings.PUBLIC_BASE_URL.rstrip("/")
        if base.startswith("https://"):
            base = "wss://" + base[8:]
        elif base.startswith("http://"):
            base = "ws://" + base[7:]
        else:
            base = f"wss://{base}"

    return f"{base}/api/v1/webhooks/twilio/media-stream"
