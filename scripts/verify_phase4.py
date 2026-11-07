"""
Vyapaar सेतु — Phase 4 Verification & Test Suite.
Validates Vobiz telephony integration:
1. VobizXML Builder & response protocols
2. Cryptographic HMAC-SHA256 signature verification & phone normalizations
3. Binary PCM 16kHz audio frame decoding & packet telemetry
4. Vobiz Voice REST API client behavior
5. Organization phone provisioning & global phone uniqueness
6. Inbound Answer Webhook: Number-to-tenant resolution & Kirana caller-ID matching
7. Call lifecycle state machine & immutable call_events audit logging
8. Strict multi-tenant isolation between Organization A and Organization B
"""

import sys
import os
import asyncio
import hmac
import hashlib
import base64
from datetime import datetime, timezone
from bson import ObjectId

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.config import settings
from app.db.mongodb import mongo_manager
from app.integrations.vobiz.xml_builder import (
    build_stream_xml,
    build_hangup_xml,
    build_reject_xml,
    build_speak_and_hangup_xml,
)
from app.integrations.vobiz.webhooks import (
    verify_vobiz_signature,
    normalize_e164,
    normalize_indian_mobile_10digit,
    parse_inbound_webhook_payload,
)
from app.integrations.vobiz.audio import AudioFrameDecoder
from app.integrations.vobiz.client import VobizClient
from app.services.telephony_service import TelephonyService
from app.services.call_service import CallService


async def run_phase4_tests():
    print("=" * 75, flush=True)
    print("  VYAPAAR सेतु — PHASE 4: VOBIZ TELEPHONY AUTOMATED TEST SUITE", flush=True)
    print("  Baatcheet se business tak.", flush=True)
    print("=" * 75, flush=True)

    test_passed = 0
    test_total = 0

    def assert_test(condition: bool, description: str):
        nonlocal test_passed, test_total
        test_total += 1
        if condition:
            test_passed += 1
            print(f"  [PASS] Test {test_total:02d}: {description}", flush=True)
        else:
            print(f"  [FAIL] Test {test_total:02d}: {description}", flush=True)
            raise AssertionError(f"Test failed: {description}")

    # =========================================================================
    # SUITE 1: VobizXML Builders
    # =========================================================================
    print("\n--- SUITE 1: VobizXML Builders & Audio Streaming Tags ---")

    stream_xml = build_stream_xml(
        websocket_url="wss://test.vyapaarsetu.in/api/v1/webhooks/vobiz/media-stream"
    )
    assert_test('<?xml version="1.0" encoding="UTF-8"?>' in stream_xml, "XML declaration present")
    assert_test('<Connect>' in stream_xml and '<Stream' in stream_xml, "Connect and Stream elements present")
    assert_test('contentType="audio/x-l16;rate=16000"' in stream_xml, "Stream specifies 16kHz PCM audio")
    assert_test('bidirectional="true"' in stream_xml, "Stream is configured bidirectional")
    assert_test('wss://test.vyapaarsetu.in' in stream_xml, "Target WebSocket URL embedded correctly")

    reject_xml = build_reject_xml("rejected")
    assert_test('<Reject reason="rejected"/>' in reject_xml, "Reject XML matches Vobiz specification")

    hangup_xml = build_hangup_xml()
    assert_test('<Hangup/>' in hangup_xml, "Hangup XML matches Vobiz specification")

    speak_xml = build_speak_and_hangup_xml("Namaste Vyapaar Setu", language="hi-IN")
    assert_test('<Speak voice="WOMAN" language="hi-IN">Namaste Vyapaar Setu</Speak>' in speak_xml, "Speak and Hangup XML generated correctly")

    # =========================================================================
    # SUITE 2: Signature Verification & Phone Normalization
    # =========================================================================
    print("\n--- SUITE 2: HMAC Webhook Verification & Normalization ---")

    secret = "vobiz_super_secret_test_key_12345"
    test_body = b'{"CallUUID":"test-uuid-1","From":"+919876543210","To":"+918047361234"}'
    valid_sig = hmac.new(secret.encode(), test_body, hashlib.sha256).hexdigest()

    assert_test(verify_vobiz_signature(test_body, valid_sig, secret), "HMAC-SHA256 signature verified for matching secret")
    assert_test(verify_vobiz_signature(test_body, f"sha256={valid_sig}", secret), "Prefix 'sha256=' stripped and verified")
    assert_test(not verify_vobiz_signature(test_body, "invalid_sig_hex", secret), "Forged signature rejected")
    assert_test(verify_vobiz_signature(test_body, None, ""), "Empty secret passes in local development")

    # Phone Normalization
    assert_test(normalize_e164("9876543210") == "+919876543210", "10-digit Indian mobile normalized to E.164")
    assert_test(normalize_e164("09876543210") == "+919876543210", "Leading 0 stripped and normalized to E.164")
    assert_test(normalize_e164("+91 98765-43210") == "+919876543210", "Spaces and dashes removed from E.164")
    assert_test(normalize_indian_mobile_10digit("+919876543210") == "9876543210", "E.164 converted to 10-digit mobile for Kirana store lookup")
    assert_test(normalize_indian_mobile_10digit("09876543210") == "9876543210", "Leading 0 converted to 10-digit mobile")

    # Payload Parsing
    parsed = parse_inbound_webhook_payload({
        "CallUUID": "call-abc-123",
        "From": "9876543210",
        "To": "8047361234",
        "CallStatus": "ringing",
        "Direction": "inbound",
    })
    assert_test(parsed["vobiz_call_id"] == "call-abc-123", "CallUUID parsed correctly")
    assert_test(parsed["normalized_from_10digit"] == "9876543210", "Caller ID normalized to 10-digit")
    assert_test(parsed["normalized_to_e164"] == "+918047361234", "Called line normalized to E.164")

    # =========================================================================
    # SUITE 3: Audio Transcoding & Decoder
    # =========================================================================
    print("\n--- SUITE 3: Binary PCM 16kHz Transcoding & Packet Tracking ---")

    decoder = AudioFrameDecoder(stream_id="stream-test-01", call_uuid="call-abc-123")
    # Simulate 20ms of silence in 16kHz 16-bit PCM: 16000 * 2 * 0.02 = 640 bytes
    dummy_pcm = b"\x00" * 640
    dummy_b64 = base64.b64encode(dummy_pcm).decode("ascii")

    msg = {
        "event": "media",
        "streamId": "stream-test-01",
        "media": {"payload": dummy_b64},
        "sequenceNumber": 1
    }
    packet = decoder.decode_media_message(msg)
    assert_test(packet is not None, "Media message decoded successfully")
    assert_test(packet.byte_length == 640, "Byte length matches PCM packet")
    assert_test(packet.duration_ms == 20.0, "Packet duration calculated as 20.0ms")
    assert_test(decoder.packet_count == 1, "Packet count incremented")
    assert_test(decoder.total_pcm_bytes == 640, "Total bytes tracked")

    outbound = AudioFrameDecoder.build_outbound_play_audio(
        stream_id="stream-test-01",
        pcm_bytes=dummy_pcm
    )
    assert_test(outbound["event"] == "playAudio", "Outbound playAudio event constructed")
    assert_test(outbound["media"]["payload"] == dummy_b64, "Outbound payload matches encoded base64")

    # =========================================================================
    # SUITE 4: Vobiz Client Diagnostics
    # =========================================================================
    print("\n--- SUITE 4: Vobiz REST API Client Diagnostics ---")

    dummy_client = VobizClient(auth_id="", auth_token="")
    diag = await dummy_client.test_connection()
    assert_test(diag["status"] == "UNCONFIGURED", "Unconfigured client returns graceful diagnostic")
    assert_test(not diag["is_connected"], "is_connected correctly False when credentials unconfigured")

    # =========================================================================
    # SUITE 5: MongoDB Atlas & Telephony Service Integration
    # =========================================================================
    print("\n--- SUITE 5: Database Persistence & Telephony Service ---")

    mongo_manager.connect()
    is_connected, _ = await mongo_manager.ping()
    assert_test(is_connected, "Connected to MongoDB Atlas cluster")
    db = mongo_manager.db
    assert_test(db is not None, "Database handle resolved")

    telephony_service = TelephonyService(db)
    call_service = CallService(db)

    # Clean up previous test runs
    test_org_a_id = "test_telephony_org_alpha"
    test_org_b_id = "test_telephony_org_bravo"
    test_phone_a = "+918047369991"
    test_phone_b = "+918047369992"

    await db.phone_configs.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})
    await db.retailers.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})
    await db.calls.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})
    await db.call_events.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})

    # 1. Provision phone for Org A
    config_a = await telephony_service.upsert_phone_config(
        organization_id=test_org_a_id,
        phone_number=test_phone_a,
        is_active=True,
        display_label="Alpha Wholesale Line"
    )
    assert_test(config_a["phone_number"] == test_phone_a, "Org A phone line provisioned in E.164")
    assert_test(config_a["is_active"] is True, "Org A line is active")
    assert_test("webhooks/vobiz/inbound-call" in config_a["webhook_url"], "Inbound webhook URL generated")

    # 2. Test global phone uniqueness (Org B cannot take Org A's phone)
    duplicate_blocked = False
    try:
        await telephony_service.upsert_phone_config(
            organization_id=test_org_b_id,
            phone_number=test_phone_a,  # Duplicate!
            is_active=True
        )
    except ValueError:
        duplicate_blocked = True
    assert_test(duplicate_blocked, "Global phone uniqueness enforced across organizations")

    # 3. Provision distinct phone for Org B
    config_b = await telephony_service.upsert_phone_config(
        organization_id=test_org_b_id,
        phone_number=test_phone_b,
        is_active=True,
        display_label="Bravo Wholesale Line"
    )
    assert_test(config_b["phone_number"] == test_phone_b, "Org B phone line provisioned")

    # 4. Resolve organization by called number ('To')
    resolved_org_a = await telephony_service.resolve_org_by_phone(test_phone_a)
    assert_test(resolved_org_a is not None and resolved_org_a["organization_id"] == test_org_a_id, "Called number resolved to Org A")
    resolved_org_b = await telephony_service.resolve_org_by_phone(test_phone_b)
    assert_test(resolved_org_b is not None and resolved_org_b["organization_id"] == test_org_b_id, "Called number resolved to Org B")
    resolved_unmapped = await telephony_service.resolve_org_by_phone("+919999999999")
    assert_test(resolved_unmapped is None, "Unregistered number resolves to None")

    # =========================================================================
    # SUITE 6: Inbound Call Webhook, Kirana Matching & State Machine
    # =========================================================================
    print("\n--- SUITE 6: Inbound Call Webhook & Kirana Caller ID Matching ---")

    # Seed a registered retailer in Org A
    kirana_phone = "9876500001"
    kirana_store = "Laxmi Kirana General Store"
    kirana_owner = "Ramesh Kumar"
    now_iso = datetime.now(timezone.utc).isoformat()

    ret_insert = await db.retailers.insert_one({
        "organization_id": test_org_a_id,
        "store_name": kirana_store,
        "owner_name": kirana_owner,
        "primary_phone": kirana_phone,
        "credit_limit": 50000,
        "current_balance": 0,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso,
    })
    kirana_id = str(ret_insert.inserted_id)

    # 1. Inbound call from registered Kirana retailer to Org A
    call_uuid_1 = "vobiz_call_test_001"
    webhook_payload_1 = {
        "CallUUID": call_uuid_1,
        "From": f"+91{kirana_phone}",
        "To": test_phone_a,
        "CallStatus": "ringing",
        "Direction": "inbound",
    }
    xml_1, call_doc_1 = await call_service.handle_inbound_call(webhook_payload_1)

    assert_test("<Stream" in xml_1, "Returned VobizXML instructs audio stream")
    assert_test(call_doc_1 is not None, "Call record created in database")
    assert_test(call_doc_1["caller_classification"] == "REGISTERED_RETAILER", "Caller classified as REGISTERED_RETAILER")
    assert_test(call_doc_1["retailer_store_name"] == kirana_store, "Retailer store name auto-resolved")
    assert_test(call_doc_1["retailer_id"] == kirana_id, "Retailer ID linked to Kirana profile")
    assert_test(call_doc_1["call_status"] == "INITIATED", "Initial call status is INITIATED")

    # Verify initial event log in call_events
    events_1 = await db.call_events.find({"vobiz_call_id": call_uuid_1}).to_list(10)
    assert_test(len(events_1) >= 1, "Initial audit event recorded in call_events")
    assert_test(events_1[0]["event_type"] == "INBOUND_ANSWER", "Event type is INBOUND_ANSWER")
    assert_test(events_1[0]["new_state"] == "INITIATED", "Event new_state is INITIATED")

    # 2. Duplicate webhook idempotency
    xml_dup, call_doc_dup = await call_service.handle_inbound_call(webhook_payload_1)
    assert_test(str(call_doc_dup["_id"]) == str(call_doc_1["_id"]), "Duplicate webhook handled idempotently")

    # 3. Inbound call from unknown caller
    call_uuid_2 = "vobiz_call_test_002"
    webhook_payload_2 = {
        "CallUUID": call_uuid_2,
        "From": "+919111222333",  # Unregistered
        "To": test_phone_a,
        "CallStatus": "ringing",
        "Direction": "inbound",
    }
    xml_2, call_doc_2 = await call_service.handle_inbound_call(webhook_payload_2)
    assert_test(call_doc_2["caller_classification"] == "UNKNOWN", "Unregistered caller classified as UNKNOWN")
    assert_test(call_doc_2["retailer_id"] is None, "Retailer ID is None for unknown caller")

    # 4. Inbound call to unassigned number -> Reject XML
    call_uuid_3 = "vobiz_call_test_003"
    webhook_payload_3 = {
        "CallUUID": call_uuid_3,
        "From": "+919876500001",
        "To": "+919998887776",  # Unmapped number
        "CallStatus": "ringing",
        "Direction": "inbound",
    }
    xml_3, call_doc_3 = await call_service.handle_inbound_call(webhook_payload_3)
    assert_test("<Reject" in xml_3, "Unassigned destination number returns <Reject> XML")
    assert_test(call_doc_3 is None, "No call created for unassigned number")

    # =========================================================================
    # SUITE 7: WebSocket Lifecycle & Call State Machine Transitions
    # =========================================================================
    print("\n--- SUITE 7: WebSocket Lifecycle & State Machine Transitions ---")

    # Stream start
    stream_id_1 = "vobiz_stream_001"
    await call_service.handle_stream_start(
        stream_id=stream_id_1,
        vobiz_call_id=call_uuid_1,
        media_format={"contentType": "audio/x-l16;rate=16000", "sampleRate": 16000}
    )
    call_after_stream = await db.calls.find_one({"vobiz_call_id": call_uuid_1})
    assert_test(call_after_stream["stream_status"] == "STREAMING", "Call stream_status updated to STREAMING")
    assert_test(call_after_stream["call_status"] == "IN_PROGRESS", "Call status updated to IN_PROGRESS")

    # Stream stop
    await call_service.handle_stream_stop(
        stream_id=stream_id_1,
        vobiz_call_id=call_uuid_1,
        telemetry_stats={"packet_count": 150, "duration_seconds": 3.0}
    )
    call_after_stop = await db.calls.find_one({"vobiz_call_id": call_uuid_1})
    assert_test(call_after_stop["stream_status"] == "DISCONNECTED", "Call stream_status updated to DISCONNECTED")

    # Call Completed lifecycle status webhook
    await call_service.handle_call_status_update({
        "CallUUID": call_uuid_1,
        "CallStatus": "completed",
        "Duration": 75,
        "HangupCause": "normal_clearing",
    })
    call_final = await db.calls.find_one({"vobiz_call_id": call_uuid_1})
    assert_test(call_final["call_status"] == "COMPLETED", "Final call status is COMPLETED")
    assert_test(call_final["duration_seconds"] == 75, "Call duration persisted as 75 seconds")
    assert_test(call_final["ended_at"] is not None, "Call ended_at timestamp recorded")

    # Chronological call_events verification
    all_events_1 = await db.call_events.find({"vobiz_call_id": call_uuid_1}).sort("event_timestamp", 1).to_list(10)
    event_types = [e["event_type"] for e in all_events_1]
    assert_test("INBOUND_ANSWER" in event_types, "Event trail contains INBOUND_ANSWER")
    assert_test("STREAM_START" in event_types, "Event trail contains STREAM_START")
    assert_test("STREAM_STOP" in event_types, "Event trail contains STREAM_STOP")
    assert_test("STATUS_UPDATE" in event_types, "Event trail contains STATUS_UPDATE")

    # =========================================================================
    # SUITE 8: Strict Multi-Tenant Isolation
    # =========================================================================
    print("\n--- SUITE 8: Multi-Tenant Tenant Isolation ---")

    # Org A queries its calls
    calls_org_a = await call_service.list_calls(organization_id=test_org_a_id)
    assert_test(calls_org_a["total"] == 2, "Org A sees exactly its 2 calls")

    # Org B queries its calls
    calls_org_b = await call_service.list_calls(organization_id=test_org_b_id)
    assert_test(calls_org_b["total"] == 0, "Org B sees 0 calls (cannot see Org A's calls)")

    # Org B attempts to query Org A's call details
    detail_cross_tenant = await call_service.get_call_detail(
        organization_id=test_org_b_id,
        call_id=str(call_doc_1["_id"])
    )
    assert_test(detail_cross_tenant is None, "Org B cannot read Org A's call detail or event timeline")

    # Clean up test records
    await db.phone_configs.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})
    await db.retailers.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})
    await db.calls.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})
    await db.call_events.delete_many({"organization_id": {"$in": [test_org_a_id, test_org_b_id]}})

    await mongo_manager.close()

    print("\n" + "=" * 75)
    print(f"  ALL {test_passed}/{test_total} TESTS PASSED SUCCESSFULLY! (PHASE 4 CERTIFIED)")
    print("=" * 75)


if __name__ == "__main__":
    print(">>> Executing verify_phase4 main entrypoint...", flush=True)
    asyncio.run(run_phase4_tests())
