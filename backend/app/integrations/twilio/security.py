import logging
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, status
from twilio.request_validator import RequestValidator
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_effective_twilio_url(request: Request) -> str:
    """
    Reconstruct the full public URL called by Twilio.
    Accounts for reverse proxies, ngrok, or Cloudflare by prioritizing
    settings.PUBLIC_BASE_URL if configured, or forwarded headers.
    """
    path_and_query = request.url.path
    if request.url.query:
        path_and_query = f"{path_and_query}?{request.url.query}"

    # If PUBLIC_BASE_URL is set and not a local loopback, prefer it for signature matching
    if settings.PUBLIC_BASE_URL and "localhost" not in settings.PUBLIC_BASE_URL and "127.0.0.1" not in settings.PUBLIC_BASE_URL:
        base = settings.PUBLIC_BASE_URL.rstrip("/")
        return f"{base}{path_and_query}"

    # Check X-Forwarded headers
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    forwarded_host = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc))

    return f"{forwarded_proto}://{forwarded_host}{path_and_query}"


def verify_twilio_signature(
    request: Request,
    form_params: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Validate that an incoming HTTP POST request was genuinely sent by Twilio.
    Verifies the X-Twilio-Signature header using the configured TWILIO_AUTH_TOKEN.
    """
    if not settings.TWILIO_VALIDATE_WEBHOOK_SIGNATURE:
        logger.debug("Twilio signature validation is disabled via TWILIO_VALIDATE_WEBHOOK_SIGNATURE=False")
        return True

    auth_token = settings.TWILIO_AUTH_TOKEN
    if not auth_token:
        logger.warning(
            "TWILIO_AUTH_TOKEN is not configured. Rejecting webhook request for security."
        )
        return False

    signature = request.headers.get("X-Twilio-Signature")
    if not signature:
        logger.warning("Missing X-Twilio-Signature header on Twilio webhook endpoint.")
        return False

    validator = RequestValidator(auth_token)
    effective_url = build_effective_twilio_url(request)
    params = form_params or {}

    # Twilio validator expects all form values as strings
    string_params = {k: str(v) for k, v in params.items()}
    is_valid = validator.validate(effective_url, string_params, signature)

    if not is_valid:
        # Also try raw request.url in case effective_url had a proxy mismatch
        raw_url = str(request.url)
        if raw_url != effective_url:
            is_valid = validator.validate(raw_url, string_params, signature)

    if not is_valid:
        logger.warning(
            f"Invalid Twilio signature for URL: {effective_url}. Verification failed."
        )

    return is_valid


async def require_twilio_signature(request: Request, form_params: Dict[str, Any]):
    """
    Dependency or helper to abort with 403 Forbidden if signature is invalid.
    """
    if not verify_twilio_signature(request, form_params):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing Twilio signature."
        )
