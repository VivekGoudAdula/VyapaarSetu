"""
Vyapaar सेतु — Vobiz Webhook Verifier & Payload Parser.
Handles HMAC-SHA256 signature verification, phone number normalizations (E.164 & 10-digit Kirana mobile),
and payload normalization across JSON and form-urlencoded requests.
"""

import hmac
import hashlib
import re
from typing import Optional, Dict, Any


def verify_vobiz_signature(
    payload_bytes: bytes,
    signature_header: Optional[str],
    secret: str,
) -> bool:
    """
    Verifies the cryptographic HMAC-SHA256 signature sent by Vobiz in webhook headers.
    Vobiz uses either X-Webhook-Signature or X-Vobiz-Signature.

    Args:
        payload_bytes: Raw request body bytes.
        signature_header: Signature header value from Vobiz.
        secret: Configured VOBIZ_WEBHOOK_SECRET.

    Returns:
        True if valid or if secret is not configured in development mode; False if invalid.
    """
    # If no secret configured in development, bypass check
    if not secret:
        return True

    if not signature_header:
        return False

    # Strip optional prefix e.g. "sha256=" or "t=...,v1=..."
    clean_sig = signature_header.strip()
    if clean_sig.startswith("sha256="):
        clean_sig = clean_sig.split("sha256=")[-1]
    elif "v1=" in clean_sig:
        # Some webhook providers use "v1=hex"
        for part in clean_sig.split(","):
            if part.strip().startswith("v1="):
                clean_sig = part.strip().split("v1=")[-1]
                break

    # Compute expected signature
    computed_sig = hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_sig.lower(), clean_sig.lower())


def normalize_e164(phone: str) -> str:
    """
    Normalizes any phone string to standard E.164 format.
    Assumes +91 for 10-digit Indian numbers without country code.
    
    Examples:
        '9876543210' -> '+919876543210'
        '09876543210' -> '+919876543210'
        '+91 98765-43210' -> '+919876543210'
        '919876543210' -> '+919876543210'
    """
    if not phone:
        return ""

    raw = str(phone).strip()
    digits = re.sub(r"[^\d]", "", raw)

    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    elif raw.startswith("+"):
        return f"+{digits}"
    else:
        return f"+{digits}" if digits else ""


def normalize_indian_mobile_10digit(phone: str) -> str:
    """
    Extracts the clean 10-digit Indian mobile number for matching against
    the distributor's retailer directory (retailers.primary_phone).
    
    Examples:
        '+919876543210' -> '9876543210'
        '09876543210'   -> '9876543210'
        '98765 43210'   -> '9876543210'
    """
    if not phone:
        return ""

    digits = re.sub(r"[^\d]", "", str(phone).strip())

    if len(digits) >= 10:
        candidate = digits[-10:]
        # Standard Indian mobile numbers start with 6, 7, 8, or 9
        return candidate
    return digits


def parse_inbound_webhook_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts and standardizes fields from Vobiz incoming webhook payloads.
    Vobiz Voice API sends PascalCase fields (CallUUID, From, To, CallStatus, Direction)
    or lowercase variants depending on configuration.
    """
    vobiz_call_id = (
        payload.get("CallUUID")
        or payload.get("call_uuid")
        or payload.get("CallId")
        or payload.get("call_id")
        or payload.get("uuid")
        or ""
    )

    from_number = (
        payload.get("From")
        or payload.get("from")
        or payload.get("Caller")
        or payload.get("caller")
        or ""
    )

    to_number = (
        payload.get("To")
        or payload.get("to")
        or payload.get("Called")
        or payload.get("called")
        or ""
    )

    call_status = (
        payload.get("CallStatus")
        or payload.get("call_status")
        or payload.get("Status")
        or payload.get("status")
        or "ringing"
    )

    direction = (
        payload.get("Direction")
        or payload.get("direction")
        or "inbound"
    )

    hangup_cause = (
        payload.get("HangupCause")
        or payload.get("hangup_cause")
        or payload.get("Reason")
        or None
    )

    duration_val = (
        payload.get("Duration")
        or payload.get("duration")
        or payload.get("CallDuration")
        or 0
    )
    try:
        duration_seconds = int(duration_val)
    except (ValueError, TypeError):
        duration_seconds = 0

    return {
        "vobiz_call_id": str(vobiz_call_id).strip(),
        "from_number": str(from_number).strip(),
        "to_number": str(to_number).strip(),
        "normalized_from_e164": normalize_e164(str(from_number)),
        "normalized_from_10digit": normalize_indian_mobile_10digit(str(from_number)),
        "normalized_to_e164": normalize_e164(str(to_number)),
        "call_status": str(call_status).upper(),
        "direction": str(direction).lower(),
        "hangup_cause": hangup_cause,
        "duration_seconds": duration_seconds,
        "raw_payload": payload,
    }

