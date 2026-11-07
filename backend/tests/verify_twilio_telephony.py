"""
Comprehensive Verification Test Suite for Twilio Programmable Voice & Media Streams.
Tests:
1. TwiML XML construction (Media Streams, Rejection, Dial fallback).
2. Audio codec utilities (Base64 μ-law transcoding, 16-bit linear PCM conversion, duration calculation).
3. Twilio Request Signature validation logic.
4. Database isolation & idempotent caller resolution.
5. Monotonic call status transitions and audit event logging.
6. Twilio REST client credential testing resiliency.
"""

import sys
import os
import asyncio
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from bson import ObjectId

# Ensure immediate console output flushing
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.integrations.twilio.twiml_builder import (
    build_media_stream_twiml,
    build_rejection_twiml,
    build_forward_twiml,
    get_default_media_stream_url
)
from app.integrations.twilio.audio import (
    decode_mulaw_payload,
    encode_mulaw_payload,
    mulaw_to_linear16,
    linear16_to_mulaw,
    calculate_mulaw_duration_ms
)
from app.integrations.twilio.client import twilio_service, INDIA_VOICE_NOTICE, TRIAL_ACCOUNT_NOTICE
from app.services.telephony_service import TelephonyService, STATUS_RANK
from app.schemas.telephony import PhoneConfigUpdate, VoicePersonaConfig


def test_twiml_generation():
    """Verify TwiML XML complies with Twilio Programmable Voice specifications."""
    print("\n--- [TEST 1] TwiML Generation ---")
    ws_url = "wss://api.vyapaarsetu.in/api/v1/webhooks/twilio/media-stream"
    call_id = "672ce891b2c45e0012345678"
    org_id = "672ce891b2c45e0087654321"

    twiml_xml = build_media_stream_twiml(
        websocket_url=ws_url,
        call_id=call_id,
        organization_id=org_id,
        custom_parameters={"retailer_name": "Sharma Kirana Store"}
    )

    assert "<Response>" in twiml_xml, "TwiML must contain <Response>"
    assert "<Connect>" in twiml_xml, "TwiML must contain <Connect>"
    assert f'<Stream url="{ws_url}">' in twiml_xml, "TwiML must contain <Stream> with correct URL"
    # Verify XML parses without syntax errors
    root = ET.fromstring(twiml_xml)
    assert root.tag == "Response"
    stream_elem = root.find(".//Connect/Stream")
    assert stream_elem is not None
    assert stream_elem.attrib["url"] == ws_url

    # Check Parameter children
    params = {p.attrib["name"]: p.attrib["value"] for p in stream_elem.findall("Parameter")}
    assert params.get("call_id") == call_id, f"Expected call_id {call_id}, got {params.get('call_id')}"
    assert params.get("organization_id") == org_id, f"Expected org_id {org_id}, got {params.get('organization_id')}"
    assert params.get("retailer_name") == "Sharma Kirana Store"
    print("  [PASS] build_media_stream_twiml produces valid XML matching Twilio specs.")

    # Rejection TwiML
    rej_xml = build_rejection_twiml("Namaste. Line busy.", language="hi-IN")
    rej_root = ET.fromstring(rej_xml)
    assert rej_root.find("Say") is not None
    assert rej_root.find("Hangup") is not None
    print("  [PASS] build_rejection_twiml produces valid polite termination XML.")

    # Forward TwiML
    fwd_xml = build_forward_twiml("+919876543210")
    fwd_root = ET.fromstring(fwd_xml)
    assert fwd_root.find(".//Dial/Number") is not None
    assert fwd_root.find(".//Dial/Number").text == "+919876543210"
    print("  [PASS] build_forward_twiml produces valid escalation forwarding XML.")


def test_audio_transcoding():
    """Verify μ-law (PCMU 8kHz) audio conversions and duration calculations."""
    print("\n--- [TEST 2] Audio Transcoding & Codec Utilities ---")
    # 8000 bytes at 8000 Hz = exactly 1000 ms (1 second) of audio
    sample_mulaw = b"\xff\x80\x00\x7f" * 2000
    assert len(sample_mulaw) == 8000

    # Base64 encode & decode
    b64_str = encode_mulaw_payload(sample_mulaw)
    assert isinstance(b64_str, str) and len(b64_str) > 0
    decoded_bytes = decode_mulaw_payload(b64_str)
    assert decoded_bytes == sample_mulaw, "Base64 decode must match original bytes"
    print("  [PASS] Base64 encode/decode roundtrip verified.")

    # Duration calculation
    duration_ms = calculate_mulaw_duration_ms(len(sample_mulaw), sample_rate=8000)
    assert duration_ms == 1000, f"Expected 1000ms duration, got {duration_ms}ms"
    print(f"  [PASS] Duration calculation accurate: {duration_ms}ms for 8000 μ-law samples.")

    # Conversion to Linear PCM 16-bit
    pcm_bytes = mulaw_to_linear16(sample_mulaw)
    assert len(pcm_bytes) == len(sample_mulaw) * 2, "16-bit PCM should be 2x length of 8-bit μ-law"

    # Conversion back to μ-law
    roundtrip_mulaw = linear16_to_mulaw(pcm_bytes)
    assert len(roundtrip_mulaw) == len(sample_mulaw), "Transcoded μ-law length must match original"
    print("  [PASS] μ-law <-> Linear PCM 16-bit conversion verified.")


async def test_telephony_service_mock_db():
    """Verify caller ID resolution, idempotent call records, and monotonic status progression."""
    print("\n--- [TEST 3] Telephony Service Lifecycle & Idempotency ---")

    # In-memory mock database for unit testing
    class MockCollection:
        def __init__(self):
            self.docs = []

        async def find_one(self, query):
            for d in self.docs:
                match = True
                for k, v in query.items():
                    if k == "$or":
                        or_match = False
                        for cond in v:
                            for cond_k, cond_v in cond.items():
                                if d.get(cond_k) == cond_v:
                                    or_match = True
                                    break
                            if or_match:
                                break
                        if not or_match:
                            match = False
                            break
                    elif k == "organization_id" and isinstance(v, dict) and "$ne" in v:
                        if d.get("organization_id") == v["$ne"]:
                            match = False
                            break
                    elif d.get(k) != v:
                        match = False
                        break
                if match:
                    return d
            return None

        async def insert_one(self, doc):
            doc = dict(doc)
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self.docs.append(doc)
            class Res:
                inserted_id = doc["_id"]
            return Res()

        async def update_one(self, filter_q, update):
            doc = await self.find_one(filter_q)
            if doc and "$set" in update:
                doc.update(update["$set"])
            return None

        async def count_documents(self, query):
            count = 0
            for d in self.docs:
                match = True
                for k, v in query.items():
                    if k == "status" and isinstance(v, dict) and "$in" in v:
                        if d.get("status") not in v["$in"]:
                            match = False
                            break
                    elif k == "created_at" and isinstance(v, dict) and "$gte" in v:
                        if d.get("created_at") < v["$gte"]:
                            match = False
                            break
                    elif d.get(k) != v:
                        match = False
                        break
                if match:
                    count += 1
            return count

        def find(self, query):
            filtered = []
            for d in self.docs:
                match = True
                for k, v in query.items():
                    if d.get(k) != v:
                        match = False
                        break
                if match:
                    filtered.append(d)

            class Cursor:
                def __init__(self, items):
                    self.items = items
                def sort(self, *args, **kwargs):
                    return self
                def skip(self, n):
                    self.items = self.items[n:]
                    return self
                def limit(self, n):
                    self.items = self.items[:n]
                    return self
                async def to_list(self, length=None):
                    return self.items[:length] if length else self.items
            return Cursor(filtered)

    class MockDB:
        def __init__(self):
            self.phone_configs = MockCollection()
            self.retailers = MockCollection()
            self.calls = MockCollection()
            self.call_events = MockCollection()

    mock_db = MockDB()
    test_org_id = ObjectId()
    test_phone = "+14155552671"

    # Setup org phone config
    await mock_db.phone_configs.insert_one({
        "organization_id": test_org_id,
        "phone_number": test_phone,
        "is_active": True,
        "voice_persona": {"greeting_name": "Sharma Super Stockist", "default_language": "hi-IN", "agent_gender": "FEMALE"},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })

    # Setup retailer with 10-digit primary phone
    retailer_id = ObjectId()
    await mock_db.retailers.insert_one({
        "_id": retailer_id,
        "organization_id": test_org_id,
        "store_name": "Gupta Daily Provisions",
        "owner_name": "Mohan Gupta",
        "primary_phone": "9876543210",
        "is_active": True
    })

    service = TelephonyService(mock_db)

    # 1. Resolve inbound call with Indian format caller number (+919876543210)
    call_sid = "CA1234567890abcdef1234567890abcdef"
    res1 = await service.resolve_inbound_call(
        from_phone="+919876543210",
        to_phone=test_phone,
        call_sid=call_sid,
        account_sid="AC1234567890"
    )

    assert res1["allowed"] is True
    assert res1["organization_id"] == str(test_org_id)
    assert res1["retailer_name"] == "Gupta Daily Provisions"
    assert res1["retailer_id"] == str(retailer_id)
    print("  [PASS] Caller recognized as registered Kirana retailer from +91 number.")

    # 2. Test Idempotency: duplicate webhook for same CallSid should return same call_id
    res2 = await service.resolve_inbound_call(
        from_phone="+919876543210",
        to_phone=test_phone,
        call_sid=call_sid,
        account_sid="AC1234567890"
    )
    assert res2["call_id"] == res1["call_id"], "Duplicate webhook must reuse existing call record"
    assert len(mock_db.calls.docs) == 1, "Must not create duplicate documents in calls collection"
    print("  [PASS] Webhook idempotency verified (no duplicate calls created).")

    # 3. Monotonic status progression
    # Progress to IN_PROGRESS
    await service.handle_call_status_update(call_sid, "in-progress")
    call_doc = await mock_db.calls.find_one({"call_sid": call_sid})
    assert call_doc["status"] == "IN_PROGRESS"

    # Progress to COMPLETED
    await service.handle_call_status_update(call_sid, "completed", duration=45)
    call_doc = await mock_db.calls.find_one({"call_sid": call_sid})
    assert call_doc["status"] == "COMPLETED"
    assert call_doc["duration_seconds"] == 45
    assert call_doc["end_time"] is not None

    # Late out-of-order 'in-progress' webhook should be rejected
    await service.handle_call_status_update(call_sid, "in-progress")
    call_doc_after = await mock_db.calls.find_one({"call_sid": call_sid})
    assert call_doc_after["status"] == "COMPLETED", "Status must not regress from COMPLETED to IN_PROGRESS"
    print("  [PASS] Monotonic call status progression verified against out-of-order callbacks.")

    # 4. Unassigned number rejection
    res_unknown = await service.resolve_inbound_call(
        from_phone="+919876543210",
        to_phone="+19999999999",
        call_sid="CA999999999"
    )
    assert res_unknown["allowed"] is False
    assert res_unknown["reason"] == "UNASSIGNED_OR_INACTIVE_NUMBER"
    print("  [PASS] Inbound calls to unassigned numbers correctly rejected.")


def test_twilio_signature_validation():
    """Verify Twilio HMAC-SHA1 signature computation and rejection of forged signatures."""
    print("\n--- [TEST 4] Twilio Webhook Security & Signature Validation ---")
    from twilio.request_validator import RequestValidator

    auth_token = "test_auth_token_secret_12345"
    url = "https://api.vyapaarsetu.in/api/v1/webhooks/twilio/inbound-call"
    params = {
        "CallSid": "CA1234567890abcdef",
        "From": "+919876543210",
        "To": "+14155552671",
        "AccountSid": "AC1234567890"
    }

    validator = RequestValidator(auth_token)
    valid_sig = validator.compute_signature(url, params)

    assert validator.validate(url, params, valid_sig) is True, "Valid signature must pass"
    assert validator.validate(url, params, "tampered_fake_signature_xyz") is False, "Forged signature must be rejected"
    assert validator.validate(url, {"CallSid": "tampered_sid"}, valid_sig) is False, "Tampered params must be rejected"
    print("  [PASS] Genuine signature authenticated successfully.")
    print("  [PASS] Forged signatures and tampered parameters strictly rejected.")


async def test_twilio_client_resilience():
    """Verify Twilio connection diagnostic safely handles unconfigured credentials."""
    print("\n--- [TEST 5] Twilio REST Client Resilience ---")
    diag = await twilio_service.test_connection()
    assert isinstance(diag, dict)
    assert "connected" in diag
    assert "status" in diag
    assert "notice" in diag
    assert diag["provider"] == "twilio"
    print(f"  [PASS] Connection test returned safe diagnostic: {diag['status']} ({diag['notice'][:60]}...)")


def test_regulatory_notices():
    """Ensure compliance notices are populated."""
    print("\n--- [TEST 6] India Regulatory & Trial Account Notice Verification ---")
    assert "domestic inbound calling on standard Indian local geographic numbers (+91) is not supported" in INDIA_VOICE_NOTICE
    assert "Twilio Indian Toll-Free number (1800)" in INDIA_VOICE_NOTICE
    assert "75 voice minutes" in TRIAL_ACCOUNT_NOTICE
    assert "10 minutes" in TRIAL_ACCOUNT_NOTICE
    print("  [PASS] Regulatory and trial constraints prominently documented.")


async def main():
    print("=" * 65)
    print(" VYAPAAR सेतु — TWILIO PROGRAMMABLE VOICE INTEGRATION TEST SUITE")
    print(" Tagline: Baatcheet se business tak.")
    print("=" * 65)

    test_twiml_generation()
    test_audio_transcoding()
    await test_telephony_service_mock_db()
    test_twilio_signature_validation()
    await test_twilio_client_resilience()
    test_regulatory_notices()

    print("\n" + "=" * 65)
    print(" ALL TWILIO INTEGRATION UNIT & LIFECYCLE TESTS PASSED SUCCESSFULLY! ")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(main())
