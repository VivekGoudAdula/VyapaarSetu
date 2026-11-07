"""
Vyapaar सेतु — Vobiz Telephony Integration Package.
Handles VobizXML generation, webhook verification, audio payload codecs, and Vobiz Voice API client.
"""

from app.integrations.vobiz.xml_builder import build_stream_xml, build_hangup_xml, build_reject_xml
from app.integrations.vobiz.webhooks import verify_vobiz_signature, normalize_e164, normalize_indian_mobile_10digit
from app.integrations.vobiz.audio import AudioFrameDecoder, AudioPacket
from app.integrations.vobiz.client import VobizClient

__all__ = [
    "build_stream_xml",
    "build_hangup_xml",
    "build_reject_xml",
    "verify_vobiz_signature",
    "normalize_e164",
    "normalize_indian_mobile_10digit",
    "AudioFrameDecoder",
    "AudioPacket",
    "VobizClient",
]
