"""
Vyapaar सेतु — Vobiz Webhook Verifier & Payload Parser.
Implements the official Vobiz Voice API V3/V2 HMAC-SHA256 signature verification protocol,
phone number normalizations (E.164 & 10-digit Kirana mobile), and webhook payload normalization.
"""

import hmac
import hashlib
import base64
import re
import time
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("vyapaar_setu.telephony.webhooks")

# In-memory recent nonce cache to guard against replay attacks (TTL: 10 minutes)
_SEEN_NONCES: Dict[str, float] = {}
NONCE_EXPIRY_SECONDS = 600.0


def _is_nonce_replay(nonce: str) -> bool:
    """Checks if a nonce was recently consumed to prevent replay attacks."""
    now = time.time()
    # Prune expired nonces
    expired = [k for k, ts in _SEEN_NONCES.items() if now - ts > NONCE_EXPIRY_SECONDS]
    for k in expired:
        _SEEN_NONCES.pop(k, None)

    if nonce in _SEEN_NONCES:
        return True
    _SEEN_NONCES[nonce] = now
    return False


def verify_vobiz_signature(
    target_url: str,
    headers: Dict[str, str],
    auth_token: str,
    payload_bytes: Optional[bytes] = None,
    secret: Optional[str] = None,
) -> bool:
    """
    Verifies the authenticity of incoming Vobiz Voice API webhooks.
    
    Supports:
    1. Official Vobiz Voice API V3 (Recommended):
       Header: X-Vobiz-Signature-V3 & Nonce: X-Vobiz-Signature-V3-Nonce
       Signature = Base64(HMAC-SHA256(key=authToken, msg=baseURL + "." + nonce))
    
    2. Official Vobiz Voice API V2:
       Header: X-Vobiz-Signature-V2 & Nonce: X-Vobiz-Signature-V2-Nonce
       Signature = Base64(HMAC-SHA256(key=authToken, msg=baseURL + nonce))
       
    3. Custom Webhook Fallback (X-Webhook-Signature):
       Header: X-Webhook-Signature
       Signature = Hex(HMAC-SHA256(key=secret, msg=payload_bytes))

    Args:
        target_url: The webhook callback URL without query parameters.
        headers: Request HTTP headers mapping.
        auth_token: The account VOBIZ_AUTH_TOKEN used as the signing key.
        payload_bytes: Optional raw request body bytes for custom webhook format.
        secret: Optional VOBIZ_WEBHOOK_SECRET for custom subscription verification.

    Returns:
        True if signature is valid or if unconfigured in local development; False if invalid.
    """
    key = (auth_token or secret or "").strip()
    # In development mode, if neither token nor secret is configured, allow requests through
    if not key:
        return True

    # Case-insensitive header lookup
    hdr_lower = {k.lower(): v for k, v in headers.items()}
    clean_url = target_url.split("?")[0].rstrip("/")

    # 1. Official Vobiz Voice V3 Verification
    sig_v3 = hdr_lower.get("x-vobiz-signature-v3")
    nonce_v3 = hdr_lower.get("x-vobiz-signature-v3-nonce")
    if sig_v3 and nonce_v3:
        if _is_nonce_replay(nonce_v3.strip()):
            logger.warning(f"Rejected Vobiz V3 webhook: Replay detected for nonce {nonce_v3}")
            return False

        canonical_msg = f"{clean_url}.{nonce_v3.strip()}".encode("utf-8")
        computed = base64.b64encode(
            hmac.new(key.encode("utf-8"), canonical_msg, hashlib.sha256).digest()
        ).decode("utf-8")

        if hmac.compare_digest(sig_v3.strip(), computed.strip()):
            return True

    # 2. Official Vobiz Voice V2 Verification
    sig_v2 = hdr_lower.get("x-vobiz-signature-v2")
    nonce_v2 = hdr_lower.get("x-vobiz-signature-v2-nonce")
    if sig_v2 and nonce_v2:
        if _is_nonce_replay(nonce_v2.strip()):
            logger.warning(f"Rejected Vobiz V2 webhook: Replay detected for nonce {nonce_v2}")
            return False

        canonical_msg = f"{clean_url}{nonce_v2.strip()}".encode("utf-8")
        computed = base64.b64encode(
            hmac.new(key.encode("utf-8"), canonical_msg, hashlib.sha256).digest()
        ).decode("utf-8")

        if hmac.compare_digest(sig_v2.strip(), computed.strip()):
            return True

    # 3. Custom Webhook / Body HMAC-SHA256 Fallback
    sig_custom = hdr_lower.get("x-webhook-signature") or hdr_lower.get("x-vobiz-signature")
    if sig_custom and payload_bytes:
        clean_sig = sig_custom.strip()
        if clean_sig.startswith("sha256="):
            clean_sig = clean_sig[7:]

        computed_hex = hmac.new(
            key=key.encode("utf-8"),
            msg=payload_bytes,
            digestmod=hashlib.sha256
        ).hexdigest()

        if hmac.compare_digest(clean_sig.lower(), computed_hex.lower()):
            return True

    logger.warning("Vobiz webhook verification failed: Signature headers missing or mismatched.")
    return False


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
