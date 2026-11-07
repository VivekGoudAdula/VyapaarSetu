"""
Vyapaar सेतु — VobizXML Builder.
Constructs valid Vobiz-compliant XML responses for inbound call control,
bidirectional audio streaming, call rejections, and graceful hangups.
"""

from typing import Optional
import xml.sax.saxutils as saxutils


def escape_xml(text: str) -> str:
    """Safely escape text for XML node content."""
    return saxutils.escape(str(text))


def build_stream_xml(
    websocket_url: str,
    content_type: str = "audio/x-l16;rate=16000",
    bidirectional: bool = True,
    keep_call_alive: bool = True,
) -> str:
    """
    Constructs a VobizXML Response containing a <Connect><Stream> instruction.
    Directs Vobiz to open a bidirectional WebSocket audio stream to Vyapaar सेतु.

    Args:
        websocket_url: Absolute WebSocket URL (e.g. wss://domain.com/api/v1/webhooks/vobiz/media-stream)
        content_type: Audio format specification (default: audio/x-l16;rate=16000)
        bidirectional: Whether audio flows both ways (True for conversational AI)
        keep_call_alive: Keep call active even during silence

    Returns:
        Formatted XML string with UTF-8 XML declaration.
    """
    bidi_attr = "true" if bidirectional else "false"
    keep_alive_attr = "true" if keep_call_alive else "false"
    escaped_url = escape_xml(websocket_url.strip())

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        "    <Connect>\n"
        f'        <Stream bidirectional="{bidi_attr}" keepCallAlive="{keep_alive_attr}" contentType="{content_type}">\n'
        f"            {escaped_url}\n"
        "        </Stream>\n"
        "    </Connect>\n"
        "</Response>"
    )


def build_hangup_xml() -> str:
    """
    Constructs a VobizXML Response with a <Hangup/> command.
    Used when a call has concluded or cannot be serviced.
    """
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        "    <Hangup/>\n"
        "</Response>"
    )


def build_reject_xml(reason: str = "rejected") -> str:
    """
    Constructs a VobizXML Response with a <Reject/> command.
    Used when the destination number is not mapped to any active organization.

    Args:
        reason: 'rejected' or 'busy'
    """
    safe_reason = escape_xml(reason if reason in ["rejected", "busy"] else "rejected")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f'    <Reject reason="{safe_reason}"/>\n'
        "</Response>"
    )


def build_speak_and_hangup_xml(
    message: str,
    voice: str = "WOMAN",
    language: str = "hi-IN"
) -> str:
    """
    Constructs a polite announcement followed by an automatic hangup.
    Useful for diagnostic or unregistered number scenarios.
    """
    escaped_msg = escape_xml(message)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f'    <Speak voice="{voice}" language="{language}">{escaped_msg}</Speak>\n'
        "    <Hangup/>\n"
        "</Response>"
    )
