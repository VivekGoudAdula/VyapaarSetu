import asyncio
import logging
from typing import Dict, Any, Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from twilio.http.http_client import TwilioHttpClient
from app.core.config import settings

logger = logging.getLogger(__name__)

INDIA_VOICE_NOTICE = (
    "IMPORTANT TELEPHONY NOTICE (INDIA): Official Twilio guidelines state that domestic inbound "
    "calling on standard Indian local geographic numbers (+91) is not supported. Inbound calls "
    "within India require a Twilio Indian Toll-Free number (1800) or an international number "
    "with international dialing enabled on the caller's carrier."
)

TRIAL_ACCOUNT_NOTICE = (
    "Twilio Free Trial Notice: Free trial accounts include 75 voice minutes, require all "
    "caller phone numbers to be pre-verified in the Twilio Console, and cap individual call "
    "duration at a maximum of 10 minutes."
)


class TwilioService:
    """
    Service wrapper around Twilio's official Python REST SDK.
    Provides async-compatible methods for credential verification and number inspection.
    """

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None
    ):
        self.account_sid = account_sid or settings.TWILIO_ACCOUNT_SID
        self.auth_token = auth_token or settings.TWILIO_AUTH_TOKEN
        self._client: Optional[Client] = None

    def _get_client(self) -> Client:
        """Lazily initialize and return the Twilio REST Client."""
        if not self.account_sid or not self.auth_token:
            raise ValueError("Twilio Account SID and Auth Token must be configured.")
        if self._client is None:
            http_client = TwilioHttpClient(timeout=5.0)
            self._client = Client(self.account_sid, self.auth_token, http_client=http_client)
        return self._client

    async def test_connection(self) -> Dict[str, Any]:
        """
        Validate configured Twilio credentials against the official Twilio REST API.
        Never throws unhandled exceptions; returns a structured status response.
        """
        if not self.account_sid or not self.auth_token:
            return {
                "connected": False,
                "provider": "twilio",
                "status": "DISCONNECTED",
                "notice": "Twilio Account SID or Auth Token is not configured in backend settings (.env)."
            }

        try:
            # Twilio Python SDK is blocking; run in executor with 8s timeout to preserve event loop
            loop = asyncio.get_running_loop()
            account = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._get_client().api.accounts(self.account_sid).fetch()
                ),
                timeout=8.0
            )

            status_text = getattr(account, "status", "active")
            friendly_name = getattr(account, "friendly_name", "Twilio Account")
            account_type = getattr(account, "type", "Standard")

            notice = f"Successfully authenticated with Twilio account '{friendly_name}' (Status: {status_text}, Type: {account_type})."
            if account_type.lower() == "trial":
                notice += f" {TRIAL_ACCOUNT_NOTICE}"

            return {
                "connected": True,
                "provider": "twilio",
                "status": "CONNECTED",
                "notice": notice
            }

        except asyncio.TimeoutError:
            logger.warning("Twilio API connection timed out after 8 seconds.")
            return {
                "connected": False,
                "provider": "twilio",
                "status": "DISCONNECTED",
                "notice": "Connection timed out connecting to Twilio Cloud API. Please verify network access."
            }
        except TwilioRestException as exc:
            logger.warning(f"Twilio connection test failed with TwilioRestException: {exc.msg} (Code: {exc.code})")
            return {
                "connected": False,
                "provider": "twilio",
                "status": "DISCONNECTED",
                "notice": f"Twilio API Error ({exc.code}): {exc.msg}"
            }
        except Exception as exc:
            logger.error(f"Unexpected error validating Twilio credentials: {exc}", exc_info=True)
            return {
                "connected": False,
                "provider": "twilio",
                "status": "DISCONNECTED",
                "notice": f"Failed to connect to Twilio: {str(exc)}"
            }

    async def verify_phone_number_assignment(self, phone_number: str) -> Dict[str, Any]:
        """
        Verify if a given phone number is registered on this Twilio account.
        """
        if not self.account_sid or not self.auth_token:
            return {"verified": False, "reason": "Twilio credentials not configured."}

        try:
            loop = asyncio.get_running_loop()
            numbers = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._get_client().incoming_phone_numbers.list(phone_number=phone_number, limit=1)
                ),
                timeout=8.0
            )

            if numbers:
                matched = numbers[0]
                capabilities = getattr(matched, "capabilities", {})
                voice_enabled = capabilities.get("voice", False) if isinstance(capabilities, dict) else getattr(capabilities, "voice", False)

                return {
                    "verified": True,
                    "phone_number": matched.phone_number,
                    "friendly_name": matched.friendly_name,
                    "voice_enabled": voice_enabled,
                    "sid": matched.sid
                }
            else:
                return {
                    "verified": False,
                    "reason": f"Phone number {phone_number} is not listed under Twilio account {self.account_sid[:6]}..."
                }

        except Exception as exc:
            logger.warning(f"Could not verify phone number on Twilio: {exc}")
            return {
                "verified": False,
                "reason": str(exc)
            }


# Singleton service instance
twilio_service = TwilioService()
