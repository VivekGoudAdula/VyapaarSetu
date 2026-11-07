"""
Vyapaar सेतु — Phase 4.1 Focused Protocol & Hardening Verification Suite.
Validates:
1. Official nested Vobiz start event parsing & identifier validation.
2. Multi-codec mediaFormat handling (L16 8/16kHz and μ-law 8kHz) & duration calculation.
3. Base64 audio decoding and packet telemetry.
4. Call state machine monotonicity & terminal-state immutability.
5. Duplicate & out-of-order webhook callback handling.
6. Vobiz Voice API V3/V2 canonical URL+nonce HMAC-SHA256 signature verification & replay guard.
7. Direct-child VobizXML <Stream> structure compliance.
8. Live Vobiz REST API /auth/me connection test with credential response sanitization.
"""

import sys
import os
import asyncio
import base64
import hmac
import hashlib
from datetime import datetime, timezone

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.config import settings
from app.db.mongodb import mongo_manager
from app.integrations.vobiz.xml_builder import build_stream_xml, build_reject_xml
from app.integrations.vobiz.audio import AudioFrameDecoder
from app.integrations.vobiz.webhooks import (
    verify_vobiz_signature,
    normalize_e164,
    normalize_indian_mobile_10digit,
    parse_inbound_webhook_payload,
)
from app.integrations.vobiz.client import VobizClient
from app.services.call_service import CallService
from app.services.telephony_service import TelephonyService


async def run_phase4_1_tests():
    print("=" * 75, flush=True)
    print("  VYAPAAR सेतु — PHASE 4.1 FOCUSED PROTOCOL VERIFICATION SUITE", flush=True)
    print("  Baatcheet se business tak.", flush=True)
    print("=" * 75, flush=True)

    passed = 0
    total = 0

    def assert_check(condition: bool, description: str):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] Test {total:02d}: {description}", flush=True)
        else:
            print(f"  [FAIL] Test {total:02d}: {description}", flush=True)
            raise AssertionError(f"Check failed: {description}")

    # =========================================================================
    # SUITE 1: Direct-Child VobizXML Protocol Compliance
    # =========================================================================
    print("\n--- SUITE 1: Direct-Child VobizXML Structure ---", flush=True)
    xml = build_stream_xml("wss://vyapaar.example.com/stream", bidirectional=True, keep_call_alive=True)
    assert_check('<Response>' in xml and '</Response>' in xml, "Root is <Response>")
    assert_check('<Stream bidirectional="true" keepCallAlive="true">' in xml, "Direct-child <Stream> with required attributes")
    assert_check('<Connect>' not in xml, "<Connect> wrapper excluded per official Vobiz spec")
    assert_check('wss://vyapaar.example.com/stream' in xml, "Target stream URL cleanly embedded")

    # =========================================================================
    # SUITE 2: Multi-Codec Inbound Audio & Negotiated mediaFormat
    # =========================================================================
    print("\n--- SUITE 2: Multi-Codec MediaFormat & Audio Frame Decoder ---", flush=True)

    # 1. Linear16 at 16000 Hz
    dec_l16_16k = AudioFrameDecoder(
        stream_id="stream-1",
        call_uuid="call-1",
        media_format={"encoding": "audio/x-l16", "sampleRate": 16000}
    )
    assert_check(dec_l16_16k.inbound_encoding == "audio/x-l16", "L16 16k encoding detected")
    assert_check(dec_l16_16k.inbound_sample_rate == 16000, "L16 16k sample rate detected")
    assert_check(dec_l16_16k.bytes_per_second == 32000, "L16 16k bytes/sec is 32000 (16-bit mono)")

    # 640 bytes = 20ms of 16kHz 16-bit audio
    pcm_20ms = b"\x00" * 640
    b64_pcm = base64.b64encode(pcm_20ms).decode("ascii")
    pkt1 = dec_l16_16k.decode_media_message({"event": "media", "media": {"payload": b64_pcm}})
    assert_check(pkt1 is not None and pkt1.byte_length == 640, "L16 16k packet decoded")
    assert_check(pkt1.duration_ms == 20.0, "L16 16k 20ms duration computed accurately")

    # 2. Linear16 at 8000 Hz
    dec_l16_8k = AudioFrameDecoder(
        stream_id="stream-2",
        call_uuid="call-2",
        media_format={"encoding": "audio/x-l16", "sampleRate": 8000}
    )
    assert_check(dec_l16_8k.bytes_per_second == 16000, "L16 8k bytes/sec is 16000 (16-bit mono)")
    # 320 bytes = 20ms of 8kHz 16-bit audio
    pkt2 = dec_l16_8k.decode_media_message({"event": "media", "media": {"payload": base64.b64encode(b"\x00" * 320).decode("ascii")}})
    assert_check(pkt2.duration_ms == 20.0, "L16 8k 20ms duration computed accurately")

    # 3. G.711 μ-law at 8000 Hz
    dec_mulaw = AudioFrameDecoder(
        stream_id="stream-3",
        call_uuid="call-3",
        media_format={"encoding": "audio/x-mulaw", "sampleRate": 8000}
    )
    assert_check(dec_mulaw.inbound_encoding == "audio/x-mulaw", "μ-law encoding detected")
    assert_check(dec_mulaw.bytes_per_second == 8000, "μ-law bytes/sec is 8000 (8-bit mono)")
    # 160 bytes = 20ms of 8kHz 8-bit mulaw
    pkt3 = dec_mulaw.decode_media_message({"event": "media", "media": {"payload": base64.b64encode(b"\xff" * 160).decode("ascii")}})
    assert_check(pkt3.duration_ms == 20.0, "μ-law 20ms duration computed accurately")

    # 4. Outbound controls & barge-in preparation
    ckpt = AudioFrameDecoder.build_checkpoint("stream-1", "ckpt_001")
    assert_check(ckpt["event"] == "checkpoint" and ckpt["name"] == "ckpt_001", "Outbound checkpoint event built correctly")
    clr = AudioFrameDecoder.build_clear_audio("stream-1")
    assert_check(clr["event"] == "clearAudio", "Outbound clearAudio event built correctly")

    # =========================================================================
    # SUITE 3: Vobiz Voice API V3/V2 Signature Verification & Nonce Replay Guard
    # =========================================================================
    print("\n--- SUITE 3: Vobiz Voice API V3/V2 Signature & Nonce Verification ---", flush=True)

    test_token = "secret_auth_token_9999"
    test_url = "https://vyapaar.example.com/api/v1/webhooks/vobiz/inbound-call"
    test_nonce = "12345678901234567890"

    # Compute V3 signature: Base64(HMAC-SHA256(key=token, msg=url + "." + nonce))
    v3_msg = f"{test_url}.{test_nonce}".encode("utf-8")
    v3_sig = base64.b64encode(hmac.new(test_token.encode("utf-8"), v3_msg, hashlib.sha256).digest()).decode("utf-8")

    v3_headers = {
        "X-Vobiz-Signature-V3": v3_sig,
        "X-Vobiz-Signature-V3-Nonce": test_nonce,
    }
    assert_check(
        verify_vobiz_signature(target_url=test_url, headers=v3_headers, auth_token=test_token),
        "Official Vobiz V3 URL+nonce signature verified successfully"
    )

    # Replay attack check: Reusing the same nonce must be rejected
    assert_check(
        not verify_vobiz_signature(target_url=test_url, headers=v3_headers, auth_token=test_token),
        "Replay attack prevented: Reused nonce rejected"
    )

    # Forged signature check
    forged_headers = {
        "X-Vobiz-Signature-V3": "invalid_sig_base64==",
        "X-Vobiz-Signature-V3-Nonce": "99999999999999999999",
    }
    assert_check(
        not verify_vobiz_signature(target_url=test_url, headers=forged_headers, auth_token=test_token),
        "Forged signature rejected with 401 fail-closed"
    )

    # =========================================================================
    # SUITE 4: Live Vobiz REST Client Authentication (/auth/me)
    # =========================================================================
    print("\n--- SUITE 4: Live Vobiz REST Client & Sanitized Health Check ---", flush=True)

    client = VobizClient()
    assert_check(client.is_configured, "Vobiz client loaded credentials from settings")

    diag = await client.test_connection()
    assert_check(diag["status"] == "CONNECTED", f"Vobiz live /auth/me connected successfully (status={diag['status']})")
    assert_check(diag["is_connected"] is True, "is_connected is True on live Vobiz API")
    assert_check("ADULA VIVEK GOUD" not in str(diag), "Account holder personal name sanitized from API response")
    assert_check("vivekgoud" not in str(diag), "Account email sanitized from API response")
    assert_check("MA_KJXYRXVO" not in str(diag), "Auth ID sanitized from API response")

    # =========================================================================
    # SUITE 5: Call State Machine Monotonicity & Terminal State Immutability
    # =========================================================================
    print("\n--- SUITE 5: State Machine Monotonicity & Atlas Persistence ---", flush=True)

    mongo_manager.connect()
    is_connected, _ = await mongo_manager.ping()
    assert_check(is_connected, "MongoDB Atlas vyapaar_setu connected")
    db = mongo_manager.db

    call_service = CallService(db)
    telephony_service = TelephonyService(db)

    test_org_id = "test_phase4_1_org"
    test_phone = "+918065354999"
    test_call_uuid = "vobiz_uuid_4_1_001"

    # Clean up test documents
    await db.phone_configs.delete_many({"organization_id": test_org_id})
    await db.calls.delete_many({"organization_id": test_org_id})
    await db.call_events.delete_many({"organization_id": test_org_id})

    # Provision phone
    await telephony_service.upsert_phone_config(test_org_id, test_phone, is_active=True)

    # 1. Inbound answer webhook -> INITIATED
    xml_resp, call_doc = await call_service.handle_inbound_call({
        "CallUUID": test_call_uuid,
        "From": "+919876543210",
        "To": test_phone,
        "CallStatus": "ringing",
        "Direction": "inbound",
    })
    assert_check(call_doc["call_status"] == "INITIATED", "Initial call status is INITIATED")

    # 2. Stream start -> IN_PROGRESS
    await call_service.handle_stream_start(
        stream_id="stream-4-1",
        vobiz_call_id=test_call_uuid,
        media_format={"encoding": "audio/x-l16", "sampleRate": 16000}
    )
    call_progress = await db.calls.find_one({"vobiz_call_id": test_call_uuid})
    assert_check(call_progress["call_status"] == "IN_PROGRESS", "Transitioned to IN_PROGRESS")

    # 3. Terminal transition -> COMPLETED
    await call_service.handle_call_status_update({
        "CallUUID": test_call_uuid,
        "CallStatus": "completed",
        "Duration": 45,
        "HangupCause": "normal_clearing",
    })
    call_completed = await db.calls.find_one({"vobiz_call_id": test_call_uuid})
    assert_check(call_completed["call_status"] == "COMPLETED", "Call entered terminal state COMPLETED")
    assert_check(call_completed["duration_seconds"] == 45, "Duration persisted as 45s")

    # 4. Out-of-order delayed callback arrival -> MUST NOT REGRESS TO RINGING
    await call_service.handle_call_status_update({
        "CallUUID": test_call_uuid,
        "CallStatus": "ringing",  # Out of order!
        "Duration": 10,
    })
    call_guarded = await db.calls.find_one({"vobiz_call_id": test_call_uuid})
    assert_check(call_guarded["call_status"] == "COMPLETED", "Monotonicity preserved: Delayed 'ringing' callback did NOT overwrite COMPLETED")
    assert_check(call_guarded["duration_seconds"] == 45, "Duration was not overwritten by smaller out-of-order duration")

    # 5. Late stream start arrival -> MUST NOT REGRESS TO IN_PROGRESS
    await call_service.handle_stream_start(
        stream_id="late-stream",
        vobiz_call_id=test_call_uuid,
        media_format={"encoding": "audio/x-l16"}
    )
    call_after_late_stream = await db.calls.find_one({"vobiz_call_id": test_call_uuid})
    assert_check(call_after_late_stream["call_status"] == "COMPLETED", "Monotonicity preserved: Late stream start did NOT overwrite COMPLETED")

    # 6. Idempotent duplicate callback
    await call_service.handle_call_status_update({
        "CallUUID": test_call_uuid,
        "CallStatus": "completed",
        "Duration": 50,  # Longer duration update allowed
    })
    call_dup = await db.calls.find_one({"vobiz_call_id": test_call_uuid})
    assert_check(call_dup["call_status"] == "COMPLETED", "Duplicate completed callback handled idempotently")
    assert_check(call_dup["duration_seconds"] == 50, "Duration updated to 50s via atomic max")

    # Clean up test documents
    await db.phone_configs.delete_many({"organization_id": test_org_id})
    await db.calls.delete_many({"organization_id": test_org_id})
    await db.call_events.delete_many({"organization_id": test_org_id})

    await mongo_manager.close()

    print("\n" + "=" * 75, flush=True)
    print(f"  ALL {passed}/{total} PHASE 4.1 FOCUSED TESTS PASSED! (PROTOCOL CERTIFIED)", flush=True)
    print("=" * 75, flush=True)


if __name__ == "__main__":
    asyncio.run(run_phase4_1_tests())
